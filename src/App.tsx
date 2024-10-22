import React, { useState } from 'react';

const fetchWeather = async (latitude: number, longitude: number) => {
  const response = await fetch(`http://localhost:5000/api/weather?latitude=${latitude}&longitude=${longitude}`);
  const data = await response.json();
  return data;
};

const fetchChatGPTResponse = async (weatherData: any, userPreferences: any) => {
  const response = await fetch('http://localhost:5000/api/chatgpt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ weatherData, userPreferences }),
  });
  const data = await response.json();
  return data;
};

const App: React.FC = () => {
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [preferences, setPreferences] = useState<{ favoriteTemperature: string; activity: string }>({
    favoriteTemperature: '',
    activity: ''
  });
  const [response, setResponse] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences({
      ...preferences,
      [e.target.name]: e.target.value
    });
  };

  const handleWeatherData = async () => {
    try {
      const weatherData = await fetchWeather(latitude, longitude);
      const chatGPTResponse = await fetchChatGPTResponse(weatherData, preferences);
      setResponse(chatGPTResponse);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div>
      <h1>Weather Assistant</h1>
      <input type="number" placeholder="Latitude" onChange={(e) => setLatitude(parseFloat(e.target.value))} />
      <input type="number" placeholder="Longitude" onChange={(e) => setLongitude(parseFloat(e.target.value))} />
      <input type="text" name="favoriteTemperature" placeholder="Preferred Temperature" onChange={handleChange} />
      <input type="text" name="activity" placeholder="Preferred Activity" onChange={handleChange} />
      <button onClick={handleWeatherData}>Get Weather Recommendation</button>
      {response && <p>{response}</p>}
    </div>
  );
};

export default App;
