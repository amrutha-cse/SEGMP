
# SEGMP
## Student Enrollment and Grade Management Protocol

SEGMP is a web-based student enrollment and grade management system developed as an academic simulator project.

### Features
- Student enrollment with password protection
- Student details stored in a MySQL database
- Search student results using roll number
- Display subject-wise marks, grades, and results
- Calculate SGPA using the project's defined formula

### Technologies Used
- React.js
- Vite
- Node.js
- Express.js
- MySQL

### Project Structure
- `src/` - React frontend
- `backend/` - Express backend and database connection
- `public/` - Public assets

### Running the Project
1. Install Node.js and MySQL.
2. Install frontend dependencies using `npm install`.
3. Install backend dependencies by running `npm install` inside `backend/`.
4. Configure your local database credentials in `backend/.env`.
5. Start the backend and frontend in separate terminals.

**Note:** Never upload your `.env` file or database credentials to GitHub.
