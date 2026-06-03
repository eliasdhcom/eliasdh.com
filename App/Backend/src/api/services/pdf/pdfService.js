/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 03/06/2026
**/

const PDFDocument = require('pdfkit');
const path        = require('path');
const fs          = require('fs');

const BLUE   = '#4f94f0';
const DARK   = '#1a1a2e';
const GREY   = '#555555';
const LGREY  = '#888888';
const M      = 40;
const W      = 595.28; // A4 width in points
const CW     = W - M * 2;

const T = {
    TITLE:          'SERVICE AGREEMENT',
    FROM:           'FROM',
    CLIENT_LABEL:   'CLIENT',
    INTRO_BEFORE:   'This Client Service Agreement ("Agreement") is entered into on',
    INTRO_BETWEEN:  ', by and between: EliasDH, a company incorporated under Belgian law, registered in the CBE (KBO) under number BE1034925266, hereinafter "EliasDH", and',
    INTRO_VAT:      ', registered under number',
    INTRO_AFTER:    ', hereinafter "Client". EliasDH and the Client are collectively referred to as the "Parties".',
    SUBS_APP:       'APPLICATION',
    SUBS_TYPE:      'TYPE',
    SUBS_FREQ:      'FREQUENCY',
    SUBS_PRICE:     'PRICE',
    FREQ: { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly', 'one-time': 'One-time' },
    ARTICLES: [
        { title: '1. Scope of Services', paras: [
            'EliasDH provides online infrastructure and digital availability services, including but not limited to hosting, server infrastructure, monitoring, maintenance, technical support and related online services (the "Services").',
            'The exact scope of the Services is determined by the chosen subscription or a separately agreed custom arrangement.'
        ]},
        { title: '2. Subscription & Payment', paras: [] },
        { title: '3. Intellectual Property', paras: [
            "All intellectual property rights relating to the Client's content remain the property of the Client.",
            'All infrastructure, systems, tools, configurations and methodologies used by EliasDH remain the exclusive property of EliasDH.'
        ]},
        { title: '4. Term and Termination', paras: [
            '4.1  This Agreement enters into force on the date of signature and remains valid for as long as the Client uses the Services.',
            '4.2  Either Party may terminate this Agreement before the start of a new billing period by written notice.',
            '4.3  Advance payments are non-refundable.',
            '4.4  EliasDH may immediately suspend or terminate the Services in the event of: non-payment, illegal use, abuse of infrastructure or breach of this Agreement.'
        ]},
        { title: '5. EliasDH Obligations', paras: [
            'EliasDH shall perform the Services with reasonable care and professionalism, make reasonable efforts to ensure continuity, provide support within reasonable timeframes, and treat the Client\'s non-public information confidentially.',
            'The Services are provided on a best-efforts basis and not as an obligation of result.'
        ]},
        { title: '6. Client Obligations', paras: [
            'The Client shall pay invoices on time, use the Services in accordance with Belgian and EU law, refrain from any illegal or harmful activities, and remain fully responsible for all hosted content, applications and data.',
            "The Client is responsible for its own backups unless otherwise agreed in writing, and warrants that its content does not infringe any third-party rights."
        ]},
        { title: '7. Marketing & Reference Rights', paras: [
            'The Client grants EliasDH the non-exclusive right to use the Client\'s name, trade name and logo for portfolio, reference and marketing purposes, including websites, social media, presentations and promotional material. EliasDH may also add technical attribution where appropriate (e.g. "Hosted by EliasDH").'
        ]},
        { title: '8. Limitation of Liability', paras: [
            'To the extent permitted by Belgian law: EliasDH shall not be liable for indirect or consequential damages, including loss of profit, revenue, data or business opportunities, nor for downtime caused by third parties, internet outages, force majeure or cyber incidents beyond its control.',
            'EliasDH\'s total liability is in any event limited to the total amount paid by the Client during the three (3) months preceding the damaging event.'
        ]},
        { title: '9. Force Majeure', paras: [
            'Neither Party shall be liable for delays or failures caused by circumstances beyond reasonable control, including natural disasters, power outages, internet disruptions, governmental measures or large-scale cyber incidents.'
        ]},
        { title: '10. General Provisions', paras: [
            '10.1  This Agreement constitutes the entire agreement between the Parties.',
            '10.2  Amendments are only valid if agreed in writing and signed by both Parties.',
            '10.3  If any provision is declared invalid, the remaining provisions shall remain fully in force.',
            'Questions? Contact us at info@eliasdh.com'
        ]},
    ]
};

function fd(d) {
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function generateAgreementPdf(customer, signatureDataUrl, signedAt) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const doc = new PDFDocument({ size: 'A4', margin: M, info: { Title: 'Service Agreement — EliasDH' } });

        doc.on('data', c => chunks.push(c));
        doc.on('end',  () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const today   = fd(signedAt ?? new Date());
        const contact = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();

        // ── Header banner ────────────────────────────────────────────────────
        doc.rect(0, 0, W, 85).fill(BLUE);

        const logoPath = path.join(__dirname, '../../../../Frontend/src/assets/media/images/logo.png');
        const altLogo  = path.join(__dirname, '../../../../../App/Frontend/src/assets/media/images/logo.png');
        const usedLogo = fs.existsSync(logoPath) ? logoPath : fs.existsSync(altLogo) ? altLogo : null;
        if (usedLogo) {
            try { doc.image(usedLogo, M, 20, { height: 40 }); } catch (_) {}
        }

        doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('EliasDH', M + (usedLogo ? 50 : 0), 28);
        doc.fillColor('white').fontSize(9).font('Helvetica').text('eliasdh.com', M + (usedLogo ? 50 : 0), 53);
        doc.fillColor('white').fontSize(18).font('Helvetica-Bold').text(T.TITLE, 0, 35, { align: 'right', width: W - M });

        // ── FROM / CLIENT ────────────────────────────────────────────────────
        let y = 105;
        const col2 = M + CW / 2 + 10;

        doc.fillColor(LGREY).fontSize(7.5).font('Helvetica-Bold');
        doc.text(T.FROM,         M,    y);
        doc.text(T.CLIENT_LABEL, col2, y);
        y += 14;

        doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold');
        doc.text('EliasDH BV', M,    y);
        doc.text(customer.name,  col2, y);
        y += 14;

        doc.fillColor(GREY).fontSize(8.5).font('Helvetica');
        doc.text('info@eliasdh.com  ·  eliasdh.com', M, y);
        if (contact) doc.text(contact, col2, y);
        y += 12;

        doc.text('VAT: BE1034925266', M, y);
        if (customer.vat) doc.text(`VAT: ${customer.vat}`, col2, y);
        y += 12;

        doc.text(`Date: ${today}`, M, y);
        y += 20;

        // ── Divider ──────────────────────────────────────────────────────────
        doc.moveTo(M, y).lineTo(W - M, y).strokeColor('#d2d2d2').lineWidth(0.5).stroke();
        y += 10;

        // ── Intro ────────────────────────────────────────────────────────────
        const intro = `${T.INTRO_BEFORE} ${today}${T.INTRO_BETWEEN} ${customer.name}${customer.vat ? `${T.INTRO_VAT} ${customer.vat}` : ''}${T.INTRO_AFTER}`;
        doc.fillColor(GREY).fontSize(8).font('Helvetica').text(intro, M, y, { width: CW });
        y = doc.y + 10;

        // ── Helper: section title ────────────────────────────────────────────
        const addTitle = (title) => {
            if (y > 750) { doc.addPage(); y = M; }
            doc.fillColor(BLUE).fontSize(8.5).font('Helvetica-Bold').text(title, M, y, { width: CW });
            y = doc.y + 4;
        };

        const addPara = (text) => {
            if (y > 740) { doc.addPage(); y = M; }
            doc.fillColor(GREY).fontSize(8).font('Helvetica').text(text, M, y, { width: CW });
            y = doc.y + 4;
        };

        // ── Article 1 ────────────────────────────────────────────────────────
        addTitle(T.ARTICLES[0].title);
        T.ARTICLES[0].paras.forEach(addPara);
        y += 4;

        // ── Article 2 + subscription table ──────────────────────────────────
        addTitle(T.ARTICLES[1].title);
        addPara('2.1  The Client subscribes to the following subscription or custom arrangement with EliasDH:');

        const subs = (customer.websites ?? []).filter(w => w.name);
        if (subs.length) {
            if (y > 720) { doc.addPage(); y = M; }
            const colW = [CW * 0.42, CW * 0.18, CW * 0.22, CW * 0.18];
            const rowH = 18;

            doc.rect(M, y, CW, rowH).fill('#f1f3f8');
            doc.fillColor('#464646').fontSize(7.5).font('Helvetica-Bold');
            let cx = M + 4;
            [T.SUBS_APP, T.SUBS_TYPE, T.SUBS_FREQ, T.SUBS_PRICE].forEach((h, i) => {
                doc.text(h, cx, y + 5, { width: colW[i] - 4 });
                cx += colW[i];
            });
            y += rowH;

            for (const w of subs) {
                if (y > 730) { doc.addPage(); y = M; }
                cx = M + 4;
                doc.fillColor(DARK).fontSize(8).font('Helvetica-Bold').text(w.name, cx, y + 3, { width: colW[0] - 4 });
                doc.fillColor(LGREY).fontSize(7).font('Helvetica').text(w.url, cx, y + 13, { width: colW[0] - 4 });
                cx += colW[0];
                doc.fillColor(DARK).fontSize(8).font('Helvetica').text(w.subscriptionType, cx, y + 7, { width: colW[1] - 4 });
                cx += colW[1];
                doc.text(T.FREQ[w.frequency] ?? w.frequency, cx, y + 7, { width: colW[2] - 4 });
                cx += colW[2];
                doc.fillColor(BLUE).font('Helvetica-Bold').text(`€${Number(w.payment).toFixed(2)}`, cx, y + 7, { width: colW[3] - 8, align: 'right' });
                y += 22;
            }
            doc.moveTo(M, y).lineTo(W - M, y).strokeColor('#d2d2d2').lineWidth(0.5).stroke();
            y += 6;
        }

        ['2.2  Services are invoiced in advance on a monthly, quarterly or annual basis. Quarterly or annual invoicing constitutes advance payment for the relevant service period and does not create a fixed contractual term unless expressly agreed otherwise in writing.',
         '2.3  All invoices are payable in advance and within 5 days of the invoice date.',
         '2.4  In the event of late payment, EliasDH reserves the right to: (a) suspend the Services and (b) apply a fixed penalty of 5% per 2 days.'
        ].forEach(addPara);
        y += 4;

        // ── Articles 3–10 ────────────────────────────────────────────────────
        for (let i = 2; i < T.ARTICLES.length; i++) {
            addTitle(T.ARTICLES[i].title);
            T.ARTICLES[i].paras.forEach(addPara);
            y += 4;
        }

        // ── Signature section ────────────────────────────────────────────────
        const sigNeeded = 60 + (signatureDataUrl ? 50 : 30);
        if (y + sigNeeded > 780) { doc.addPage(); y = M; }

        doc.moveTo(M, y).lineTo(W - M, y).strokeColor('#d2d2d2').lineWidth(0.5).stroke();
        y += 10;

        const declaration = `By signing, I confirm, on behalf of ${customer.name}, that I have read and agree to all terms above, and I hereby become an official client of EliasDH.`;
        doc.fillColor('#505050').fontSize(8).font('Helvetica').text(declaration, M, y, { width: CW });
        y = doc.y + 10;

        const sigColW = CW / 2 - 10;
        const sigX    = M + sigColW + 20;

        doc.fillColor(LGREY).fontSize(7.5).font('Helvetica-Bold');
        doc.text('NAME & TITLE', M,    y);
        doc.text('SIGNATURE',    sigX, y);
        y += 12;

        doc.fillColor(DARK).fontSize(9).font('Helvetica').text(contact || customer.name, M, y);
        doc.fillColor(LGREY).fontSize(8).text(`Date: ${today}`, M, y + 12);

        if (signatureDataUrl && signatureDataUrl.length > 0) {
            try {
                const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '');
                const imgBuf = Buffer.from(base64Data, 'base64');
                doc.image(imgBuf, sigX, y - 4, { width: sigColW, height: 45 });
            } catch (_) {
                drawSignedBox(doc, sigX, y, sigColW, today);
            }
        } else {
            drawSignedBox(doc, sigX, y, sigColW, today);
        }

        // ── Footer on all pages ──────────────────────────────────────────────
        const totalPages = doc.bufferedPageRange ? doc.bufferedPageRange().count : 1;
        const footer = 'EliasDH BV  ·  VAT: BE1034925266  ·  info@eliasdh.com  ·  eliasdh.com';
        for (let pg = 0; pg < totalPages; pg++) {
            doc.switchToPage(pg);
            doc.moveTo(M, 820).lineTo(W - M, 820).strokeColor('#d2d2d2').lineWidth(0.5).stroke();
            doc.fillColor(LGREY).fontSize(7.5).font('Helvetica').text(footer, M, 825, { width: CW - 60 });
            doc.text(`Page ${pg + 1} / ${totalPages}`, M, 825, { width: CW, align: 'right' });
        }

        doc.end();
    });
}

function drawSignedBox(doc, x, y, w, date) {
    doc.roundedRect(x, y - 4, w, 40, 4).fillAndStroke('#f0f7ff', BLUE);
    doc.fillColor(BLUE).fontSize(9).font('Helvetica-Bold').text('Electronically signed', x, y + 6, { width: w, align: 'center' });
    doc.fillColor('#6496c8').fontSize(7.5).font('Helvetica').text(date, x, y + 20, { width: w, align: 'center' });
}

module.exports = { generateAgreementPdf };
