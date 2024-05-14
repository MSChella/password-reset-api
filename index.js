const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const bcrypt = require('bcrypt');
// const User = require('./model/user.model');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect('mongodb+srv://reachchellapathyms:jGF6HgcEB07RPGm6@passwordreset.wybabdt.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});


const User = mongoose.model('User', {
    email: String,
    password: String,
    resetToken: String,
});

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your_email@gmail.com',
        pass: 'your_password',
    },
});

// Forget Password Endpoint



app.post('/api/create', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user with hashed password
        const newUser = new User({
            email,
            password: hashedPassword,
        });

        // Save the user to the database
        await newUser.save();

        // Respond with the created user
        res.status(201).json(newUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});



app.post('/api/forget-password', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = randomstring.generate(10);
    user.resetToken = resetToken;
    await user.save();

    const mailOptions = {
        from: 'your_email@gmail.com',
        to: email,
        subject: 'Password Reset',
        text: `Click the following link to reset your password: http://localhost:3000/reset-password/${resetToken}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ message: 'Error sending email' });
        } else {
            console.log('Email sent: ' + info.response);
            return res.status(200).json({ message: 'Email sent successfully' });
        }
    });
});

// Password Reset Endpoint
app.post('/reset-password', async (req, res) => {
    const { resetToken, newPassword } = req.body;
    const user = await User.findOne({ resetToken });

    if (!user) {
        return res.status(404).json({ message: 'Invalid or expired token' });
    }

    user.password = newPassword;
    user.resetToken = '';
    await user.save();

    return res.status(200).json({ message: 'Password reset successful' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
