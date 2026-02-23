// Koli İçeriği PDF Oluşturma Utility'si
import jsPDF from "jspdf";
import type { BoxDetail } from "@/lib/types/box";

/**
 * Seçilen kolilerin içeriğini departman bazlı gruplandırılmış PDF olarak oluşturur ve indirir.
 * - Departman başlıkları altında koli adı ve kodu
 * - Her koli için ürün tablosu (Ürün Adı, Adet, Tür)
 * - Koli resmi EKLENMİYOR
 * - Türkçe karakter desteği (ASCII fallback)
 * - Sayfa taşması yönetimi
 * - Tarih/saat damgası footer
 */
export function generateBoxContentPDF(boxes: BoxDetail[]): void {
    if (boxes.length === 0) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Türkçe karakter ASCII fallback
    const turkishToASCII = (text: string): string => {
        const map: Record<string, string> = {
            ç: "c", Ç: "C", ğ: "g", Ğ: "G", ı: "i", İ: "I",
            ö: "o", Ö: "O", ş: "s", Ş: "S", ü: "u", Ü: "U",
        };
        return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, (char) => map[char] || char);
    };

    // Sayfa taşma kontrolü
    const checkNewPage = (needed: number) => {
        if (y + needed > pageHeight - 20) {
            addFooter();
            doc.addPage();
            y = margin;
        }
    };

    // Footer
    const addFooter = () => {
        const now = new Date();
        const dateStr = now.toLocaleString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            turkishToASCII(`Olusturulma: ${dateStr}`),
            margin,
            pageHeight - 8
        );
        doc.text(
            turkishToASCII(`Sayfa ${doc.getNumberOfPages()}`),
            pageWidth - margin,
            pageHeight - 8,
            { align: "right" }
        );
    };

    // Kolileri departman bazlı grupla
    const grouped: Record<string, BoxDetail[]> = {};
    for (const box of boxes) {
        const deptName = box.department?.name || "Bilinmeyen";
        if (!grouped[deptName]) grouped[deptName] = [];
        grouped[deptName].push(box);
    }

    // Başlık
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175); // blue-800
    doc.text(turkishToASCII("Koli Icerigi Raporu"), pageWidth / 2, y, {
        align: "center",
    });
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
        turkishToASCII(`Toplam ${boxes.length} koli - ${Object.keys(grouped).length} departman`),
        pageWidth / 2,
        y,
        { align: "center" }
    );
    y += 10;

    // Ayırma çizgisi
    doc.setDrawColor(59, 130, 246); // blue-500
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    const departmentNames = Object.keys(grouped).sort();

    for (let dIdx = 0; dIdx < departmentNames.length; dIdx++) {
        const deptName = departmentNames[dIdx];
        const deptBoxes = grouped[deptName];

        // Departman başlığı
        checkNewPage(20);
        doc.setFillColor(239, 246, 255); // blue-50
        doc.roundedRect(margin, y - 1, contentWidth, 10, 2, 2, "F");
        doc.setFontSize(13);
        doc.setTextColor(30, 64, 175); // blue-800
        doc.text(turkishToASCII(`${deptName} (${deptBoxes.length} koli)`), margin + 4, y + 6);
        y += 14;

        for (let bIdx = 0; bIdx < deptBoxes.length; bIdx++) {
            const box = deptBoxes[bIdx];

            // Koli başlığı
            checkNewPage(25);
            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59); // slate-800
            doc.text(turkishToASCII(box.name), margin + 2, y);
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text(turkishToASCII(`Kod: ${box.code}`), margin + 2, y + 5);
            y += 10;

            if (!box.lines || box.lines.length === 0) {
                doc.setFontSize(9);
                doc.setTextColor(148, 163, 184);
                doc.text(turkishToASCII("(Icerik yok)"), margin + 4, y);
                y += 8;
            } else {
                // Tablo başlığı
                checkNewPage(12);
                doc.setFillColor(241, 245, 249); // slate-100
                doc.rect(margin, y - 1, contentWidth, 7, "F");
                doc.setFontSize(8);
                doc.setTextColor(71, 85, 105); // slate-600
                doc.setFont("helvetica", "bold");
                doc.text(turkishToASCII("Urun Adi"), margin + 3, y + 4);
                doc.text("Adet", margin + contentWidth * 0.7, y + 4);
                doc.text(turkishToASCII("Tur"), margin + contentWidth * 0.85, y + 4);
                y += 9;

                doc.setFont("helvetica", "normal");

                for (const line of box.lines) {
                    checkNewPage(8);
                    doc.setFontSize(9);
                    doc.setTextColor(51, 65, 85); // slate-700

                    // Ürün adı - truncate if needed
                    const productName = line.product_name || "-";
                    const maxNameWidth = contentWidth * 0.65;
                    let displayName = turkishToASCII(productName);
                    while (doc.getTextWidth(displayName) > maxNameWidth && displayName.length > 3) {
                        displayName = displayName.slice(0, -4) + "...";
                    }
                    doc.text(displayName, margin + 3, y);

                    // Adet
                    doc.text(String(line.qty || 0), margin + contentWidth * 0.7, y);

                    // Tür
                    doc.text(turkishToASCII(line.kind || "-"), margin + contentWidth * 0.85, y);

                    y += 6;
                }
            }

            // Koliler arası ayırıcı
            if (bIdx < deptBoxes.length - 1) {
                y += 2;
                doc.setDrawColor(226, 232, 240); // slate-200
                doc.setLineWidth(0.2);
                doc.line(margin + 4, y, pageWidth - margin - 4, y);
                y += 4;
            }
        }

        // Departmanlar arası boşluk
        if (dIdx < departmentNames.length - 1) {
            y += 6;
            doc.setDrawColor(59, 130, 246);
            doc.setLineWidth(0.3);
            doc.line(margin, y, pageWidth - margin, y);
            y += 6;
        }
    }

    // Son sayfa footer
    addFooter();

    // İndir
    const now = new Date();
    const fileName = `Koli_Icerigi_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}.pdf`;
    doc.save(fileName);
}
