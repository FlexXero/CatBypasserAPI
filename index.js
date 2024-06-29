// index.js

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { API_URLS, DEFAULT_API, API_CREDITS } from './const.js';
import { METHOD, NO_PARAMETERS, NO_URL, NO_RESULT } from './errors.js';

let counter = 0; // Counter for logging successful requests.

const app = express();

// Middleware setup
app.use(express.json());
app.use(cors());

// Port setup
const port = process.env.PORT || 5500;
app.listen(port, () => {
    console.info(`Server is listening on port: ${port}`);
});

// Define HTTP methods for invalid requests
const handleInvalidMethod = (_, response) => {
    response.json(METHOD);
};

app.post('/', handleInvalidMethod);
app.put('/', handleInvalidMethod);
app.delete('/', handleInvalidMethod);

// Handle GET requests with query parameters bypass and url
app.get('/', async (request, response) => {
    try {
        const bypass = request.query.bypass;
        const urlParam = request.query.url;

        // Check for required parameters
        if (!bypass || !urlParam) {
            return response.json(NO_PARAMETERS);
        }

        // Validate bypass parameter
        const activeAPI = API_URLS[bypass];
        if (!activeAPI) {
            return response.json(NO_PARAMETERS);
        }

        const url = activeAPI + urlParam;
        const data = await fetch(url)
            .then(res => {
                if (res.ok) {
                    return res.json();
                }
                throw new Error(res.statusText);
            })
            .catch(error => {
                throw new Error(`Failed to fetch: ${error}`);
            });

        // Determine success based on fetched data
        const success = data.success && !!data.destination;
        const message = success ? data.destination : NO_RESULT;

        // Log successful requests
        if (success) {
            console.info(`[${counter}] ${urlParam} -> ${message}`);
            counter++;
        }

        // Add credits information based on the API used
        if (success && API_CREDITS[bypass]) {
            data.credits = API_CREDITS[bypass];
        }

        response.json(data);
    } catch (error) {
        console.error(`Error processing request: ${error}`);
        response.json({
            success: false,
            message: `Something went wrong: ${error.message}`
        });
    }
});
