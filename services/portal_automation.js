
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

export class PortalAutomation {
    constructor() {
        this.downloadPath = path.resolve('./temp_downloads');
        if (!fs.existsSync(this.downloadPath)) {
            fs.mkdirSync(this.downloadPath, { recursive: true });
        }
    }

    /**
     * Common Login Logic
     * Matches Flow: User ID (TAN) -> Continue -> Password & Secure Access Msg -> Login
     */
    async login(page, tan, password) {
        console.log(`[Portal] Attempting login for TAN: ${tan}`);
        await page.goto('https://eportal.incometax.gov.in/iec/foservices/#/login', { waitUntil: 'networkidle2' });

        // 1. Enter TAN
        await page.waitForSelector('#panAdhaarUserId', { timeout: 15000 });
        await page.type('#panAdhaarUserId', tan);

        const [continueBtn] = await page.$$('text/Continue');
        if (continueBtn) {
            await continueBtn.click();
        } else {
            await page.click('button.login-btn');
        }

        // 2. Handle Password & Secure Access Message
        await page.waitForSelector('#password', { timeout: 15000 });

        console.log(`[Portal] Confirming Secure Access Message...`);
        try {
            // Try different ways to find the checkbox
            const secureCheckbox = await page.$('input[type="checkbox"]');
            if (secureCheckbox) {
                await secureCheckbox.click();
            } else {
                const [secureMsg] = await page.$$('text/Please confirm your secure access message');
                if (secureMsg) await secureMsg.click();
            }
        } catch (e) {
            console.warn(`[Portal] Warning: Could not explicitly confirm secure access message:`, e.message);
        }

        console.log(`[Portal] Entering password...`);
        await page.type('#password', password);

        const [loginBtn] = await page.$$('text/Login');
        if (loginBtn) {
            await loginBtn.click();
        } else {
            await page.keyboard.press('Enter');
        }
    }

    /**
     * Automated CSI Download
     * Matches Flow: Dashboard -> e-File -> e-Pay Tax -> CSI -> Dates -> Filter -> Download
     */
    async downloadCsi(tan, password, fromDate, toDate) {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        try {
            await page.target().createCDPSession().then(client =>
                client.send('Page.setDownloadBehavior', {
                    behavior: 'allow',
                    downloadPath: this.downloadPath
                })
            );

            await this.login(page, tan, password);

            // Wait for dashboard to load
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
            console.log(`[Portal] Dashboard loaded.`);

            // Navigate: e-File > e-Pay Tax
            await page.waitForSelector('text/e-File', { timeout: 15000 });
            const [eFileMenu] = await page.$$('text/e-File');
            if (eFileMenu) await eFileMenu.click();

            await page.waitForSelector('text/e-Pay Tax', { timeout: 10000 });
            const [ePayTaxItem] = await page.$$('text/e-Pay Tax');
            if (ePayTaxItem) await ePayTaxItem.click();

            // Select: Challan Status Inquiry (CSI)
            console.log(`[Portal] Moving to CSI tab...`);
            await page.waitForSelector('text/Challan Status Inquiry (CSI)', { timeout: 15000 });
            const [csiTab] = await page.$$('text/Challan Status Inquiry (CSI)');
            if (csiTab) {
                await csiTab.click();
            } else {
                // Direct fallback
                await page.goto('https://eportal.incometax.gov.in/iec/foservices/#/dashboard/e-pay-tax/csi', { waitUntil: 'networkidle2' });
            }

            // Fill Dates
            console.log(`[Portal] Entering date range: ${fromDate} to ${toDate}`);
            await page.waitForSelector('input[placeholder="From Date"]', { timeout: 15000 });

            // Clear and type
            await page.focus('input[placeholder="From Date"]');
            await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control');
            await page.keyboard.press('Backspace');
            await page.type('input[placeholder="From Date"]', fromDate);

            await page.focus('input[placeholder="To Date"]');
            await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control');
            await page.keyboard.press('Backspace');
            await page.type('input[placeholder="To Date"]', toDate);

            // Filter
            const [filterBtn] = await page.$$('text/Filter Challan');
            if (filterBtn) await filterBtn.click();

            // Download
            console.log(`[Portal] Downloading...`);
            await page.waitForSelector('text/Download Challan File', { timeout: 20000 });
            const [downloadBtn] = await page.$$('text/Download Challan File');

            if (downloadBtn) {
                const initialFiles = fs.readdirSync(this.downloadPath);
                await downloadBtn.click();

                let downloadedFile = null;
                for (let i = 0; i < 40; i++) {
                    await new Promise(r => setTimeout(r, 1000));
                    const currentFiles = fs.readdirSync(this.downloadPath);
                    const newFiles = currentFiles.filter(f => !initialFiles.includes(f) && !f.endsWith('.crdownload'));
                    if (newFiles.length > 0) {
                        downloadedFile = path.join(this.downloadPath, newFiles[0]);
                        break;
                    }
                }

                if (downloadedFile) {
                    const content = fs.readFileSync(downloadedFile, 'utf8');
                    fs.unlinkSync(downloadedFile);
                    return content;
                } else {
                    throw new Error("Download verification timed out.");
                }
            } else {
                throw new Error("Download button did not appear.");
            }

        } catch (error) {
            console.error(`[Portal Automation Error] ${error.message}`);
            throw error;
        } finally {
            await browser.close();
        }
    }

    /**
     * Launch Portal Bridge (Visible)
     */
    async launchPortal(tan, password) {
        const browser = await puppeteer.launch({
            headless: false,
            executablePath: process.env.CHROME_PATH || undefined,
            defaultViewport: null,
            args: ['--start-maximized', '--no-sandbox']
        });

        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();

        try {
            await this.login(page, tan, password);
            console.log(`[Portal Bridge] Auto-login attempted successfully.`);
            return { success: true };
        } catch (error) {
            console.error(`[Portal Bridge Error] ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    getDateRangeForReturn(quarter, fy) {
        const [yearStart, yearEndShort] = fy.split('-');
        const yearStartNum = parseInt(yearStart);
        const yearEndNum = 2000 + parseInt(yearEndShort);

        switch (quarter) {
            case 'Q1': return { from: `01/04/${yearStartNum}`, to: `30/06/${yearStartNum}` };
            case 'Q2': return { from: `01/07/${yearStartNum}`, to: `30/09/${yearStartNum}` };
            case 'Q3': return { from: `01/10/${yearStartNum}`, to: `31/12/${yearStartNum}` };
            case 'Q4': return { from: `01/01/${yearEndNum}`, to: `31/03/${yearEndNum}` };
            default: throw new Error(`Invalid quarter: ${quarter}`);
        }
    }
}
