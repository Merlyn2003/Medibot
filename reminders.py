# Reminder.py
import streamlit as st
from datetime import datetime, time
import pymongo
from bson.objectid import ObjectId

# Set page config
st.set_page_config(page_title="🕑 Reminders")

st.title("⏰ Reminders")
st.markdown("Use this page to set reminders for your upcoming appointments, medications, and more!")

# Connect to MongoDB
client = pymongo.MongoClient("mongodb://localhost:27017")
db = client["healthapp"]
reminder_collection = db["reminders"]

# Input fields
reminder_title = st.text_input("Reminder Title")
reminder_date = st.date_input("Date")
reminder_time = st.time_input("Time", value=time(9, 0))
notes = st.text_area("Notes", placeholder="Add any extra notes...")

# Set reminder
if st.button("Set Reminder"):
    reminder = {
        "title": reminder_title,
        "date": reminder_date.strftime("%Y-%m-%d"),
        "time": reminder_time.strftime("%H:%M"),
        "notes": notes,
        "created_at": datetime.utcnow()
    }
    reminder_collection.insert_one(reminder)
    st.success(f"✅ Reminder set for **{reminder_title}** at {reminder_time} on {reminder_date}")

st.markdown("---")
st.subheader("📋 Upcoming Reminders")

# Fetch and display reminders
reminders = list(reminder_collection.find().sort("date", 1))

if reminders:
    for reminder in reminders:
        with st.container():
            st.markdown(f"### 📝 {reminder['title']}")
            st.markdown(f"📅 **Date:** {reminder['date']} | ⏰ **Time:** {reminder['time']}")
            if reminder.get("notes"):
                st.markdown(f"🗒️ *{reminder['notes']}*")
            if st.button("🗑️ Delete", key=str(reminder["_id"])):
                reminder_collection.delete_one({"_id": ObjectId(reminder["_id"])})
                st.success("Reminder deleted!")
                st.rerun()
else:
    st.info("No reminders set yet.")

st.markdown("---")
st.info("💡 Soon, you'll be able to receive notifications!")
