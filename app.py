import streamlit as st
import re

def classify_sms(text):
    t = text.lower()

    if re.search(r'\b(otp|one time password|verification code)\b', t):
        return "OTP"

    if re.search(r'\b(bill|due|payment|pay by|invoice|amount|rs\.?)\b', t):
        return "Bills / Payments"

    if re.search(r'\b(train|flight|pnr|boarding|departure|arrival)\b', t):
        return "Travel Alert"

    if re.search(r'(http|https|www|bit\.ly|tinyurl)', t):
        return "Scam / Phishing"

    return "Personal / Other"


def extract_action(text):
    otp = re.findall(r'\b\d{4,6}\b', text)
    if otp:
        return f"OTP Detected: {otp[0]}"

    if re.search(r'\b(pay by|due)\b', text.lower()):
        return "Payment deadline detected"

    if re.search(r'(http|https)', text.lower()):
        return "Warning: Suspicious link detected"

    return "No immediate action"


def detect_noise(text):
    if re.search(r'\b(hai|kal|aaj|paisa|karo|karte)\b', text.lower()):
        return "Noisy / Multilingual SMS"
    return "Standard SMS"


st.set_page_config(page_title="SMS Organizer", layout="centered")

st.title("📩 SMS Organizer App")
st.caption("Automatically classify SMS and extract actions")

sms = st.text_area("Paste SMS here", height=120)

if st.button("Analyze"):
    if sms.strip():
        st.subheader("Result")
        st.write("Category:", classify_sms(sms))
        st.write("SMS Type:", detect_noise(sms))
        st.write("Action:", extract_action(sms))
    else:
        st.warning("Please enter an SMS")

st.divider()

st.code("""
Sample SMS:
Your OTP is 764321 for SBI login.
Electricity bill Rs.1200 due. Pay by 15 June.
Train 12951 departs at 6:30 AM tomorrow.
Aaj paisa jeeto! Click http://bit.ly/free
""")
