import http from 'http';
import fetch from 'node-fetch';
import { parse } from 'url';
import puppeteer from 'puppeteer';

const clientId = '6766ebab3a5cfa90092423593c66ef477307f7fb';
const clientSecret = '7da4cfd60df564c9dc4b6229afa03cbbff05919d';
const redirectUri = 'http://localhost:3000/callback';

let browser;

const getAccessToken = async (authorizationCode) => {
    const response = await fetch('https://launchpad.37signals.com/authorization/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: "web_server",
            client_id: clientId,
            client_secret: clientSecret,
            code: authorizationCode,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get access token: ${response.statusText}, ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log(data);
    return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
    };
};

const openAuthUrl = async () => {
    const authUrl = `https://launchpad.37signals.com/authorization/new?type=web_server&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    console.log("URL to visit: " + authUrl);
    browser = await puppeteer.launch({ headless: true, slowMo: 50 });
    console.log(browser);
    
    const page = await browser.newPage();
    await page.goto(authUrl);

    await page.waitForSelector('#username');
    await page.type('#username', 'megha.garg@comprotechnologies.com');

    await page.click('[name="button"]');

    await page.waitForSelector('[data-role=password_container]');
    await page.waitForSelector('#password');
    await page.type('#password', 'Compro@12345');
    await page.keyboard.press('Enter');

    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');
};

// Main function to start the server and return the access token
export const startServer = () => {
    return new Promise((resolve, reject) => {
        const server = http.createServer(async (req, res) => {
            const parsedUrl = parse(req.url, true);

            if (parsedUrl.pathname === '/callback' && parsedUrl.query.code) {
                const authorizationCode = parsedUrl.query.code;
                console.log('Authorization code:', authorizationCode);

                try {
                    const { access_token, refresh_token } = await getAccessToken(authorizationCode);

                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end(`Access token: ${access_token}\nRefresh token: ${refresh_token}`);

                    // Resolve the access token to the caller
                    resolve(access_token);

                    await server.close(() => {
                        console.log('Server closed.');
                        if (browser) {
                            browser.close().then(() => console.log('Browser closed.'));
                        }
                    });
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end(`Error: ${error.message}`);
                    reject(error);
                }
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not found');
            }
        });

        const PORT = 3000;
        server.listen(PORT, async () => {
            console.log(`Server is running at http://localhost:${PORT}`);
            await openAuthUrl(); // Start the OAuth process automatically
        });
    });
};
