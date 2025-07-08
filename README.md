# 🎬 Script Story Generator

This is a full-stack project where users can input a simple prompt or storyline, and the app generates a full story and a screenplay script from it. The script is broken down into scenes and can also include AI-generated images. Users can download the script as a PDF (with or without images) or as a plain text file.

## 🚀 Features

- Generate a complete story from a short prompt
- Automatically convert the story into a scene-wise script
- Optional AI-generated images for each scene
- Download script as:
  - PDF with images
  - PDF without images
  - Plain `.txt` file
- Markdown rendering of script with styling
- Simple and responsive user interface

## 🛠️ Technologies Used

### Frontend

- React.js
- React Router
- Material UI
- React Markdown
- FileSaver.js
- React-to-PDF

### Backend

- FastAPI
- Pydantic
- GEMINI AI
- CORS Middleware
- Uvicorn


## ⚙️ How to Run the Project

### 1. Clone the Repository
```bash
git clone https://github.com/rakeshsinhaa/Script-Story.git
```

### 2. Start the Backend
```bash
cd script-story
cd backend
pip install -r requirements.txt
# Create a .env file and add your API key
uvicorn main:app --reload

.env file content for backend:
GEMINI_API_KEY=your-api-key
CLOUDFLARE_URL=add-url
```
### 3. Start the Frontend
```bash
cd frontend
npm install
npm start

.env file content for frontend:
VITE_API_URL=http://localhost:8000
```
