import cv2
import numpy as np
import os
import tensorflow as tf
from tensorflow.keras.models import load_model
from flask import Flask, Response, jsonify, request

# --- FIX ERROR MEDIAPIPE ---
import mediapipe.python.solutions.holistic as mp_holistic
import mediapipe.python.solutions.drawing_utils as mp_drawing

app = Flask(__name__)

# Izinkan HTML mengakses server Python tanpa kendala CORS
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response

# 1. Load Kedua Model
model_abjad = load_model("model_isyarat.h5", compile=False)
model_kalimat = load_model("model_kalimat.h5", compile=False)

kelas_abjad = np.load("kelas_abjad.npy", allow_pickle=True) if os.path.exists("kelas_abjad.npy") else sorted(os.listdir("ai isyarat image"))
kelas_kalimat = np.load("kelas_kalimat.npy", allow_pickle=True)

# 2. Fungsi Ekstraksi Keypoints
def get_cam_keypoints(results):
    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*4)
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    return np.concatenate([pose, lh, rh])

def cek_tangan_di_kotak(results, w, h, x1, y1, x2, y2):
    for hand_landmarks in [results.left_hand_landmarks, results.right_hand_landmarks]:
        if hand_landmarks is not None:
            cx = int(hand_landmarks.landmark[9].x * w)
            cy = int(hand_landmarks.landmark[9].y * h)
            if x1 <= cx <= x2 and y1 <= cy <= y2:
                return True
    return False

# Variabel Status Global
state = {
    "kamera_aktif": False,
    "mode_aktif": "KALIMAT",
    "flip_input_ai": False,
    "gunakan_rgb_abjad": False,
    "kalimat_hasil": "",
    "prediksi_sementara": "-",
    "conf_sementara": 0.0,
    "ada_tangan": False
}

sequence_buffer = []
huruf_stabil = ""
hitung_frame = 0
frame_counter = 0
frames_tanpa_tangan = 0
cap = None

holistic_cam = mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5)

def generate_frames():
    global cap, sequence_buffer, huruf_stabil, hitung_frame, frame_counter, frames_tanpa_tangan
    
    if cap is None or not cap.isOpened():
        cap = cv2.VideoCapture(0)

    while state["kamera_aktif"] and cap.isOpened():
        ret, raw_frame = cap.read()
        if not ret:
            break
        frame_counter += 1
        h, w, _ = raw_frame.shape

        # --- MODE 1: KALIMAT & KATA UTUH (LSTM) ---
        if state["mode_aktif"] == "KALIMAT":
            frame = cv2.flip(raw_frame, 1) if state["flip_input_ai"] else raw_frame.copy()
            
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = holistic_cam.process(image)
            image.flags.writeable = True

            mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS)
            mp_drawing.draw_landmarks(frame, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
            mp_drawing.draw_landmarks(frame, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS)

            ada_tangan = (results.left_hand_landmarks is not None) or (results.right_hand_landmarks is not None)
            state["ada_tangan"] = bool(ada_tangan)

            if ada_tangan:
                frames_tanpa_tangan = 0
                feat = get_cam_keypoints(results)
                sequence_buffer.append(feat)
                sequence_buffer = sequence_buffer[-30:]

                if len(sequence_buffer) == 30 and frame_counter % 3 == 0:
                    input_tensor = tf.constant(np.expand_dims(sequence_buffer, axis=0), dtype=tf.float32)
                    pred = model_kalimat(input_tensor, training=False).numpy()[0]
                    idx = np.argmax(pred)
                    conf = float(pred[idx])
                    label = str(kelas_kalimat[idx])
                    
                    state["prediksi_sementara"] = label
                    state["conf_sementara"] = conf

                    if conf > 0.70 and label != "Netral":
                        state["kalimat_hasil"] = label
            else:
                frames_tanpa_tangan += 1
                if frames_tanpa_tangan > 8:
                    sequence_buffer = []
                    state["prediksi_sementara"] = "-"
                    state["conf_sementara"] = 0.0
                    state["kalimat_hasil"] = ""

            display_frame = frame if state["flip_input_ai"] else cv2.flip(frame, 1)

            status_flip = "CERMIN" if state["flip_input_ai"] else "NORMAL (Asli)"
            cv2.putText(display_frame, f"MODE KALIMAT | Orientasi: {status_flip}", (20, 35),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
            
            teks_live = f"Deteksi Live: {state['prediksi_sementara']} ({state['conf_sementara']*100:.0f}%)" if state["prediksi_sementara"] != "-" else "Deteksi Live: Menunggu gerakan tangan..."
            cv2.putText(display_frame, teks_live, (20, 65),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 0), 2)

        # --- MODE 2: EJAAN ABJAD PER HURUF (CNN) ---
        elif state["mode_aktif"] == "ABJAD":
            display_frame = cv2.flip(raw_frame, 1)
            x1, y1, x2, y2 = w - 290, 90, w - 30, 350
            
            image_abjad = cv2.cvtColor(display_frame, cv2.COLOR_BGR2RGB)
            image_abjad.flags.writeable = False
            results_abjad = holistic_cam.process(image_abjad)
            
            tangan_di_kotak = cek_tangan_di_kotak(results_abjad, w, h, x1, y1, x2, y2)
            state["ada_tangan"] = bool(tangan_di_kotak)
            
            roi = display_frame[y1:y2, x1:x2].copy()
            if state["flip_input_ai"]:
                roi = cv2.flip(roi, 1)

            if tangan_di_kotak:
                frames_tanpa_tangan = 0
                warna_kotak = (0, 255, 0)
                
                roi_proses = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB) if state["gunakan_rgb_abjad"] else roi
                roi_input = cv2.resize(roi_proses, (64, 64)).astype("float32") / 255.0
                roi_input = np.reshape(roi_input, (1, 64, 64, 3))

                input_tensor_a = tf.constant(roi_input, dtype=tf.float32)
                pred_a = model_abjad(input_tensor_a, training=False).numpy()[0]
                idx_a = np.argmax(pred_a)
                conf_a = float(pred_a[idx_a])
                tebakan_huruf = str(kelas_abjad[idx_a])

                state["prediksi_sementara"] = tebakan_huruf
                state["conf_sementara"] = conf_a

                if conf_a > 0.50:
                    if tebakan_huruf == huruf_stabil:
                        hitung_frame += 1
                    else:
                        huruf_stabil = tebakan_huruf
                        hitung_frame = 0

                    if hitung_frame >= 6:
                        state["kalimat_hasil"] = tebakan_huruf
                        
                teks_pred_abjad = f"Prediksi: {tebakan_huruf} ({conf_a*100:.0f}%)"
            else:
                frames_tanpa_tangan += 1
                warna_kotak = (0, 255, 255)
                teks_pred_abjad = "Masukkan tangan ke kotak"
                hitung_frame = 0
                huruf_stabil = ""
                state["prediksi_sementara"] = "-"
                state["conf_sementara"] = 0.0
                
                if frames_tanpa_tangan > 5:
                    state["kalimat_hasil"] = ""

            cv2.rectangle(display_frame, (x1, y1), (x2, y2), warna_kotak, 2)

            preview_kecil = cv2.resize(roi, (80, 80))
            display_frame[85:165, 20:100] = preview_kecil
            cv2.rectangle(display_frame, (20, 85), (100, 165), (255, 255, 0), 1)

            status_flip = "BALIK" if state["flip_input_ai"] else "CERMIN ASLI"
            status_warna = "RGB" if state["gunakan_rgb_abjad"] else "BGR"
            
            cv2.putText(display_frame, teks_pred_abjad, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, warna_kotak, 2)
            cv2.putText(display_frame, f"MODE ABJAD | Orientasi [F]: {status_flip} | Warna [W]: {status_warna}", (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 0), 2)
            cv2.putText(display_frame, "Isi penuh kotak dengan tanganmu", (20, 70),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)

        # Encode gambar ke format JPEG untuk dikirim ke HTML
        ret, buffer = cv2.imencode('.jpg', display_frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    if cap is not None and cap.isOpened():
        cap.release()

@app.route('/video_feed')
def video_feed():
    state["kamera_aktif"] = True
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/status')
def get_status():
    return jsonify(state)

@app.route('/control', methods=['POST'])
def control():
    global cap, sequence_buffer
    aksi = request.json.get("action", "")
    if aksi == "stop":
        state["kamera_aktif"] = False
        if cap is not None and cap.isOpened():
            cap.release()
    elif aksi == "mode":
        state["mode_aktif"] = "ABJAD" if state["mode_aktif"] == "KALIMAT" else "KALIMAT"
        sequence_buffer = []
        state["kalimat_hasil"] = ""
        state["prediksi_sementara"] = "-"
    elif aksi == "flip":
        state["flip_input_ai"] = not state["flip_input_ai"]
        sequence_buffer = []
    elif aksi == "warna":
        state["gunakan_rgb_abjad"] = not state["gunakan_rgb_abjad"]
    elif aksi == "reset":
        state["kalimat_hasil"] = ""
        sequence_buffer = []
        state["prediksi_sementara"] = "-"
    return jsonify(state)

if __name__ == '__main__':
    print("Server AI SignBridge berjalan di http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, debug=False, threaded=True)