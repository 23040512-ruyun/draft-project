const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');

const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'images'));
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Configure MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'c237_project',
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up view engine
app.set('view engine', 'ejs');
// Enable static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

// Define routes
app.get('/', (req, res) => {
    connection.query('SELECT * FROM goal', (error, results) => {
        if (error) {
            console.error('Error fetching goals:', error);
            res.status(500).send('Error fetching goals');
            return;
        }
        res.render('index', { goals: results });
    });
});

app.get('/goal/:id', (req, res) => {
    const goal_id = req.params.id;
    connection.query('SELECT * FROM goals WHERE goal_id = ?', [goal_id], (error, results) => {
        if (error) {
            console.error('Error fetching goal:', error);
            res.status(500).send('Error fetching goal');
            return;
        }
        if (results.length > 0) {
            res.render('goal', { goal: results[0] });
        } else {
            res.status(404).send('Goal not found');
        }
    });
});

app.get("/addGoal", (req,res) =>{
    res.render("addGoals");
});

app.post("/addGoal", upload.single('image'), (req, res) => {
    const { goal_type, description, target_days, percentage_of_achievement} = req.body;
    let image;
    if (req.file) {
        image = req.file.filename;
    } else {
        image = null;
    }
    
    
    const sql = "INSERT INTO goal(goal_type, image, description, target_days, percentage_of_achievement) VALUES (?, ?, ?, ?, ?)";
    connection.query (sql, [goal_type, image, description, target_days, percentage_of_achievement], (error, results) =>{
        if (error){
            console.error("Err adding goal", error);
            res.status(500).send("Error adding goal");
        }else{
            res.redirect("/");
        }
    });
})


app.get('/updateGoal/:id', (req, res) => {
    const goal_id = req.params.id;
    const sql = 'SELECT * FROM goal WHERE goal_id = ?';
    connection.query(sql, [goal_id], (error, results) => {
        if (error) {
            console.error('Error fetching goal:', error);
            res.status(500).send('Error fetching goal');
            return;
        }
        if (results.length > 0) {
            res.render('updateGoal', { goal: results[0] });
        } else {
            res.status(404).send('Goal not found');
        }
    });
});

app.post('/updateGoal/:id', upload.single('image'), (req, res) => {
    const goal_id = req.params.id;
    const { goal_type, description, target_days, percentage_of_achievement } = req.body;
    const image = req.file ? req.file.filename : null;

    let sql = 'UPDATE goal SET goal_type = ?, description = ?, target_days = ?, percentage_of_achievement = ? WHERE goal_id = ?';
    let params = [goal_type, description, target_days, percentage_of_achievement, goal_id];

    if (image) {
        sql = 'UPDATE goal SET goal_type = ?, description = ?, target_days = ?, percentage_of_achievement = ?, image = ? WHERE goal_id = ?';
        params = [goal_type, description, target_days, percentage_of_achievement, image, goal_id];
    }

    connection.query(sql, params, (error, results) => { 
        if (error) {
            console.error('Error updating goal:', error);
            res.status(500).send('Error updating goal');
            return;
        }
        res.redirect('/');
    });
});


app.get('/deleteGoal/:id', (req, res) => {
    const goal_id = req.params.id;
    const sql = 'DELETE FROM goal WHERE goal_id = ?';
    connection.query(sql, [goal_id], (error, results) => {
        if (error) {
            console.error('Error deleting goal:', error);
            res.status(500).send('Error deleting goal');
            return;
        }
        res.redirect('/');
    });
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

// Handle the form submission
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    
    // For demonstration, log the contact information
    console.log('Contact Form Submission:', { name, email, message });
    
    // Optionally, you might want to save this information to a database or send an email
    // For now, we'll just redirect to the home page with a success message
    res.redirect('/');
});

// Route to serve the BMI calculator page
app.get('/bmi', (req, res) => {
    res.render('bmi'); // Ensure you have a 'bmi.ejs' view in your 'views' directory
});


// Route to calculate BMI
app.post('/calculateBMI', (req, res) => {
    const { weight, height } = req.body;

    if (weight && height) {
        // Convert height from cm to meters
        const heightInMeters = height / 100;

        // Calculate BMI
        const bmi = weight / (heightInMeters * heightInMeters);
        let bmiCategory = '';

        if (bmi < 18.5) {
            bmiCategory = 'Underweight';
        } else if (bmi >= 18.5 && bmi < 24.9) {
            bmiCategory = 'Normal weight';
        } else if (bmi >= 25 && bmi < 29.9) {
            bmiCategory = 'Overweight';
        } else {
            bmiCategory = 'Obesity';
        }

        // Send the result as JSON
        res.json({
            bmi: bmi.toFixed(2),
            category: bmiCategory
        });
    } else {
        res.status(400).json({ error: 'Please provide both weight and height.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
