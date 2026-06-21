const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generatePDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const pdfDir = __dirname;
      if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
      
      const outputPath = path.join(pdfDir, 'myntra_data.pdf');
      const doc = new PDFDocument({ 
        size: 'A4', 
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: 'Myntra - Website Data Report',
          Author: 'AI Chatbot Project',
          Subject: 'Myntra.com Scraped Data'
        }
      });
      
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Color scheme
      const colors = {
        primary: '#FF3F6C',      // Myntra pink
        secondary: '#1C1C1C',
        accent: '#F5F5F5',
        text: '#333333',
        lightPink: '#FFF0F3',
        white: '#FFFFFF'
      };

      // ============ COVER PAGE ============
      // Background
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.secondary);
      
      // Pink accent bar
      doc.rect(0, 250, doc.page.width, 4).fill(colors.primary);
      
      // Title
      doc.fill(colors.white)
         .fontSize(48)
         .font('Helvetica-Bold')
         .text('MYNTRA', 50, 180, { align: 'left' });

      doc.fill(colors.primary)
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('Website Data Report', 50, 235);

      // Subtitle
      doc.fill('#AAAAAA')
         .fontSize(14)
         .font('Helvetica')
         .text('Comprehensive data extracted from myntra.com', 50, 290);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 315);

      // Stats summary box
      const statsY = 380;
      doc.rect(50, statsY, 495, 90).fill(colors.lightPink);
      doc.fill(colors.secondary)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('DATA SUMMARY', 70, statsY + 15);
      
      doc.fill(colors.text)
         .fontSize(11)
         .font('Helvetica');
      
      let statsX = 70;
      const statItems = [
        { label: 'Navigation Links', value: data.navigation?.length || 0 },
        { label: 'Categories', value: data.categories?.length || 0 },
        { label: 'Brands', value: data.brands?.length || 0 },
        { label: 'Products Found', value: data.products?.length || 0 },
        { label: 'Deals & Offers', value: data.deals?.length || 0 }
      ];

      statItems.forEach((item, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 70 + (col * 160);
        const y = statsY + 40 + (row * 25);
        
        doc.font('Helvetica-Bold').fontSize(16).fill(colors.primary).text(item.value.toString(), x, y);
        doc.font('Helvetica').fontSize(9).fill(colors.text).text(item.label, x, y + 18);
      });

      doc.addPage();

      // ============ TABLE OF CONTENTS ============
      doc.fill(colors.secondary)
         .fontSize(26)
         .font('Helvetica-Bold')
         .text('TABLE OF CONTENTS', 50, 50);
      
      doc.rect(50, 80, 495, 2).fill(colors.primary);
      
      const tocItems = [
        '1. Website Information',
        '2. Navigation Structure',
        '3. Categories',
        '4. Brands',
        '5. Products',
        '6. Deals & Offers',
        '7. Footer Links'
      ];

      tocItems.forEach((item, i) => {
        const y = 110 + (i * 35);
        doc.fill(colors.text)
           .fontSize(14)
           .font('Helvetica')
           .text(item, 70, y);
        
        if (i < tocItems.length - 1) {
          doc.strokeColor('#E0E0E0')
             .lineWidth(0.5)
             .moveTo(70, y + 25)
             .lineTo(530, y + 25)
             .stroke();
        }
      });

      doc.addPage();

      // ============ 1. WEBSITE INFORMATION ============
      doc.fill(colors.secondary)
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('1. Website Information', 50, 50);
      
      doc.rect(50, 68, 80, 3).fill(colors.primary);

      const infoItems = [
        { label: 'Website URL', value: 'https://www.myntra.com/' },
        { label: 'Page Title', value: data.title || 'N/A' },
        { label: 'Meta Description', value: data.metaDescription || 'N/A' }
      ];

      let yPos = 95;
      infoItems.forEach(item => {
        doc.fill(colors.primary).fontSize(11).font('Helvetica-Bold').text(item.label, 50, yPos);
        doc.fill(colors.text).fontSize(11).font('Helvetica').text(item.value, 180, yPos);
        yPos += 30;
      });

      yPos += 15;

      // ============ 2. NAVIGATION STRUCTURE ============
      doc.fill(colors.secondary)
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('2. Navigation Structure', 50, yPos);
      
      yPos += 25;
      doc.rect(50, yPos, 80, 3).fill(colors.primary);
      yPos += 20;

      if (data.navigation && data.navigation.length > 0) {
        data.navigation.forEach((item, i) => {
          // Check if we need a new page
          if (yPos > 720) {
            doc.addPage();
            yPos = 50;
          }

          doc.fill(colors.primary)
             .fontSize(10)
             .font('Helvetica-Bold')
             .text(`• ${item.text}`, 55, yPos);
          
          if (item.href) {
            doc.fill('#888888')
               .fontSize(8)
               .font('Helvetica')
               .text(item.href.length > 80 ? item.href.substring(0, 80) + '...' : item.href, 130, yPos, { width: 400 });
          }
          
          yPos += 22;
        });
      } else {
        doc.fill(colors.text).fontSize(11).font('Helvetica').text('No navigation data available.', 55, yPos);
        yPos += 20;
      }

      yPos += 15;

      // ============ 3. CATEGORIES ============
      if (yPos > 650) { doc.addPage(); yPos = 50; }
      
      doc.fill(colors.secondary)
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('3. Categories', 50, yPos);
      
      yPos += 25;
      doc.rect(50, yPos, 80, 3).fill(colors.primary);
      yPos += 20;

      if (data.categories && data.categories.length > 0) {
        const categoriesPerRow = 2;
        const catWidth = 230;
        const catGap = 20;
        
        data.categories.forEach((item, i) => {
          const col = i % categoriesPerRow;
          const row = Math.floor(i / categoriesPerRow);
          const x = 55 + (col * (catWidth + catGap));
          const catY = yPos + (row * 28);

          if (catY > 730) {
            doc.addPage();
            yPos = 50;
            const newRow = 0;
            const newX = 55 + (col * (catWidth + catGap));
            const newCatY = yPos + (newRow * 28);
            
            doc.rect(newX, newCatY - 2, catWidth, 24).fill(colors.lightPink);
            doc.fill(colors.text).fontSize(9).font('Helvetica').text(
              item.text.length > 35 ? item.text.substring(0, 35) + '...' : item.text, 
              newX + 5, newCatY + 4, { width: catWidth - 10 }
            );
          } else {
            doc.rect(x, catY - 2, catWidth, 24).fill(colors.lightPink);
            doc.fill(colors.text).fontSize(9).font('Helvetica').text(
              item.text.length > 35 ? item.text.substring(0, 35) + '...' : item.text, 
              x + 5, catY + 4, { width: catWidth - 10 }
            );
          }
        });
        
        yPos += (Math.ceil(data.categories.length / categoriesPerRow) * 28) + 15;
      } else {
        doc.fill(colors.text).fontSize(11).font('Helvetica').text('No category data available.', 55, yPos);
        yPos += 20;
      }

      // ============ 4. BRANDS ============
      if (yPos > 650) { doc.addPage(); yPos = 50; }
      
      doc.fill(colors.secondary)
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('4. Brands', 50, yPos);
      
      yPos += 25;
      doc.rect(50, yPos, 80, 3).fill(colors.primary);
      yPos += 20;

      if (data.brands && data.brands.length > 0) {
        const brandsPerRow = 3;
        const brandWidth = 145;
        const brandGap = 15;

        data.brands.forEach((brand, i) => {
          const col = i % brandsPerRow;
          const row = Math.floor(i / brandsPerRow);
          const x = 55 + (col * (brandWidth + brandGap));
          const brandY = yPos + (row * 28);

          if (brandY > 730) {
            doc.addPage();
            yPos = 50;
            const newRow = 0;
            doc.fill(colors.secondary).fontSize(9).font('Helvetica').text(brand.substring(0, 25), 55, yPos + (newRow * 28));
          } else {
            doc.fill(colors.secondary).fontSize(9).font('Helvetica').text(brand.substring(0, 25), x, brandY);
          }
        });
        
        yPos += (Math.ceil(data.brands.length / brandsPerRow) * 28) + 15;
      } else {
        doc.fill(colors.text).fontSize(11).font('Helvetica').text('No brand data available.', 55, yPos);
        yPos += 20;
      }

      // ============ 5. PRODUCTS ============
      if (yPos > 600) { doc.addPage(); yPos = 50; }
      
      doc.fill(colors.secondary)
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('5. Products', 50, yPos);
      
      yPos += 25;
      doc.rect(50, yPos, 80, 3).fill(colors.primary);
      yPos += 20;

      if (data.products && data.products.length > 0) {
        data.products.forEach((item, i) => {
          if (yPos > 730) { doc.addPage(); yPos = 50; }
          
          doc.rect(55, yPos - 2, 490, 24).fill(i % 2 === 0 ? colors.white : colors.lightPink);
          
          doc.fill(colors.primary)
             .fontSize(9)
             .font('Helvetica-Bold')
             .text(`${i + 1}.`, 60, yPos + 3, { width: 25 });
          
          const title = item.title || item.text?.substring(0, 60) || 'N/A';
          doc.fill(colors.text)
             .fontSize(9)
             .font('Helvetica')
             .text(title.length > 70 ? title.substring(0, 70) + '...' : title, 85, yPos + 3, { width: 460 });
          
          yPos += 22;
        });
        
        yPos += 15;
      } else {
        doc.fill(colors.text).fontSize(11).font('Helvetica').text('No product data available.', 55, yPos);
        yPos += 20;
      }

      // ============ 6. DEALS & OFFERS ============
      if (yPos > 650) { doc.addPage(); yPos = 50; }
      
      doc.fill(colors.secondary)
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('6. Deals & Offers', 50, yPos);
      
      yPos += 25;
      doc.rect(50, yPos, 80, 3).fill(colors.primary);
      yPos += 20;

      if (data.deals && data.deals.length > 0) {
        data.deals.forEach((deal, i) => {
          if (yPos > 730) { doc.addPage(); yPos = 50; }
          
          doc.rect(55, yPos - 2, 490, 30).fill(colors.lightPink);
          
          doc.fill(colors.primary)
             .fontSize(18)
             .font('Helvetica-Bold')
             .text('🎯', 60, yPos, { width: 20 });
          
          doc.fill(colors.text)
             .fontSize(9)
             .font('Helvetica')
             .text(deal.text.substring(0, 120), 85, yPos + 3, { width: 450 });
          
          yPos += 32;
        });
        
        yPos += 15;
      } else {
        doc.fill(colors.text).fontSize(11).font('Helvetica').text('No deals or offers data available.', 55, yPos);
        yPos += 20;
      }

      // ============ 7. FOOTER LINKS ============
      if (yPos > 650) { doc.addPage(); yPos = 50; }
      
      doc.fill(colors.secondary)
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('7. Footer Links', 50, yPos);
      
      yPos += 25;
      doc.rect(50, yPos, 80, 3).fill(colors.primary);
      yPos += 20;

      if (data.footer && data.footer.length > 0) {
        const footerPerRow = 3;
        data.footer.forEach((link, i) => {
          const col = i % footerPerRow;
          const row = Math.floor(i / footerPerRow);
          const x = 55 + (col * 160);
          const linkY = yPos + (row * 22);

          if (linkY > 730) {
            doc.addPage();
            yPos = 50;
            doc.fill('#888888').fontSize(8).font('Helvetica').text(link.substring(0, 30), 55, yPos);
          } else {
            doc.fill('#888888').fontSize(8).font('Helvetica').text(link.substring(0, 30), x, linkY);
          }
        });
      } else {
        doc.fill(colors.text).fontSize(11).font('Helvetica').text('No footer data available.', 55, yPos);
      }

      // ============ FOOTER ON EACH PAGE ============
      const footerFooter = () => {
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          const bottom = doc.page.height - 30;
          doc.fillColor('#CCCCCC')
             .fontSize(8)
             .font('Helvetica')
             .text(`Myntra Data Report | Generated: ${new Date().toLocaleDateString()} | Page ${i + 1}`, 50, bottom, { align: 'center', width: doc.page.width - 100 });
        }
      };

      doc.on('finish', () => {
        footerFooter();
      });

      // Finalize
      doc.end();

      stream.on('finish', () => {
        const stats = fs.statSync(outputPath);
        console.log(`✅ PDF generated successfully: ${outputPath}`);
        console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
        resolve(outputPath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
      
    } catch (err) {
      reject(err);
    }
  });
}

// Run if executed directly
if (require.main === module) {
  const sampleData = {
    title: 'Myntra - Online Shopping for Fashion',
    metaDescription: 'Shop online for latest fashion trends',
    navigation: [
      { text: 'Men', href: '/men' },
      { text: 'Women', href: '/women' },
      { text: 'Kids', href: '/kids' },
      { text: 'Home & Living', href: '/home-living' },
      { text: 'Beauty', href: '/beauty' },
      { text: 'Studio', href: '/studio' }
    ],
    categories: [
      { text: 'T-Shirts', href: '/tshirts' },
      { text: 'Shirts', href: '/shirts' },
      { text: 'Jeans', href: '/jeans' }
    ],
    brands: ['Nike', 'Adidas', 'Puma', 'H&M', 'Zara', 'Levis', 'USPA', 'Wrangler', 'Roadster', 'Mast & Harbour'],
    products: [
      { title: 'Men Printed T-Shirt', text: 'Comfortable cotton blend fabric', href: '/product/1' },
      { title: 'Women Ethnic Kurta', text: 'Elegant design for festive wear', href: '/product/2' }
    ],
    deals: [
      { text: 'Flat 50% off on Latest Collections', href: '/deals' },
      { text: 'Buy 3 Get 2 Free on Accessories', href: '/offers' }
    ],
    footer: ['About Us', 'Contact Us', 'Terms of Use', 'Privacy Policy', 'Returns Policy']
  };
  
  generatePDF(sampleData).catch(err => console.error(err));
}

module.exports = { generatePDF };
