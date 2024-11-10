// Create table users (id SERIAL PRIMARY KEY, username VARCHAR(255) UNIQUE, email VARCHAR(255) UNIQUE, password VARCHAR(255), provider VARCHAR(50), provider_id VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const passport = require('./authConfig')
const { registerUser } = require('./authConfig');

const bcrypt = require('bcryptjs');
const session = require('express-session');
const flash = require('connect-flash');

require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); 


app.use(
  session({
    secret: 'password', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  })
);

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));




// Local login route
app.post('/login', passport.authenticate('local'), (req, res) => {
  console.log('User authenticated:', req.user);
  res.json({ message: 'Logged in successfully', user: req.user });
});

// app.post('/login', (req, res, next) => {
//   console.log('Login route hit');
//   next();
// }, passport.authenticate('local', {
//   successRedirect: '/profile',
//   failureRedirect: '/login',
//   failureFlash: true
// }));


app.get('/login', (req, res) => {
  res.send('<form action="/login" method="POST"><input type="text" name="username" placeholder="Username" required /><input type="password" name="password" placeholder="Password" required /><button type="submit">Login</button></form>');
});

app.get('/register', (req, res) => {
  res.send('<form action="/register" method="POST"><input type="text" name="username" placeholder="Username" required /><input type="email" name="email" placeholder="Email" required /><input type="password" name="password" placeholder="Password" required /><button type="submit">Register</button></form>');
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    await registerUser(username, email, password);
    res.json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Google authentication
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.logout();
  res.json({ message: 'Logged out successfully' });
});

// Facebook authentication
// app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
// app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/' }), (req, res) => {
//   res.redirect('/');
// });



app.get('/api/weather', async (req, res) => {
  const { latitude, longitude } = req.query;
  try {
    const weatherResponse = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m`);
    // console.log(cityResponse)
    res.json(weatherResponse.data);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).send('Error fetching weather data');
  }
});

app.get('/api/city',async(req,res)=>{
  const {city} = req.query;
  try{
    const cityResponse=await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
    const { latitude, longitude } = cityResponse.data.results[0];
    res.json({ latitude, longitude });
  } catch (error){
    console.error('Error fetching city data',error);
    res.status(500).send('Error fetching city data');
  }
});

app.post('/api/chatgpt', async (req, res) => {
  const { weatherData, userPreferences,date } = req.body;
  try {
    const chatResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo-1106',
        messages: [
          {
            role: 'system',
            content: 'You are a weather assistant. Provide recommendations based on customer preferences.'
          },
          {
            role: 'user',
            content: `Here is the weather data: ${JSON.stringify(weatherData)}. The customer preferences are: ${JSON.stringify(userPreferences)}, provide recommendations for a date of: ${JSON.stringify(date)}, in this format JSON - summary:,clothes:[hat:(if required),top:,bottom:,shoes:],items:[], explanation:[]
where in explanation you explain why you have chosen the clothes and items. write no text at all, only provide the JSON.`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(chatResponse.data.choices[0].message.content);
  } catch (error) {
    console.error('Error fetching ChatGPT response:', error);
    res.status(500).send('Error fetching ChatGPT response');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
