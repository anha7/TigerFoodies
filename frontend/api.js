import axios from 'axios';

// Heroku backend URL
const API_URL = 'https://tigerfoodies-backend.herokuapp.com';

export const fetchFoodCards = () => {
    return axios.get(`${API_URL}/cards`);
};
