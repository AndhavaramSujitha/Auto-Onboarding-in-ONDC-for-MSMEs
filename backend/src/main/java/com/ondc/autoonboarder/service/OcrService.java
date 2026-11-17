
package com.ondc.autoonboarder.service;

import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.io.MemoryUsageSetting;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.rendering.ImageType;

import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.sax.BodyContentHandler;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import org.xml.sax.SAXException;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.charset.StandardCharsets;

@Service
public class OcrService {

    private final ITesseract tesseract;

    @Value("${app.ocr.tesseract-data-path:}")
    private String tessdataPath;

    public OcrService() {
        tesseract = new Tesseract();
        tesseract.setLanguage("eng");
    }

    public String extractText(File file) throws IOException {

        if (file == null || !file.exists() || !file.isFile()) {
            throw new IOException("PDF file not found.");
        }

        if (!file.getName().toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF files are supported.");
        }

        if (file.length() == 0) {
            throw new IOException("PDF file is empty.");
        }

        byte[] header = new byte[5];

        try (var input = Files.newInputStream(file.toPath())) {
            if (input.read(header) != 5 ||
                    !new String(header, StandardCharsets.US_ASCII).equals("%PDF-")) {
                throw new IOException("Invalid PDF file.");
            }
        }

        if (tessdataPath != null && !tessdataPath.isBlank()) {
            tesseract.setDatapath(tessdataPath);
        }

        // First attempt: extract embedded text using Apache Tika
        String extractedText = extractUsingTika(file);

        if (extractedText != null && !extractedText.isBlank()) {
            System.out.println("Text extracted using Apache Tika.");
            return extractedText.trim();
        }

        // Second attempt: OCR scanned PDF using Tesseract
        System.out.println("No embedded text found. Starting scanned PDF OCR.");

        return extractUsingTesseract(file);
    }

    private String extractUsingTika(File file) {

        try (var input = Files.newInputStream(file.toPath())) {

            BodyContentHandler handler = new BodyContentHandler(-1);
            Metadata metadata = new Metadata();

            AutoDetectParser parser = new AutoDetectParser();

            parser.parse(input, handler, metadata);

            return handler.toString();

        } catch (IOException | TikaException | SAXException e) {

            System.out.println("Tika extraction failed: " + e.getMessage());

            return "";
        }
    }

    private String extractUsingTesseract(File file) throws IOException {

        StringBuilder extractedText = new StringBuilder();

        try (PDDocument document = PDDocument.load(
                file,
                MemoryUsageSetting.setupTempFileOnly())) {

            PDFRenderer renderer = new PDFRenderer(document);

            for (int page = 0; page < document.getNumberOfPages(); page++) {

                BufferedImage image = renderer.renderImageWithDPI(
                        page,
                        300,
                        ImageType.RGB
                );

                try {
                    String pageText = tesseract.doOCR(image);
                    extractedText.append(pageText).append("\n");
                } finally {
                    image.flush();
                }
            }

        } catch (TesseractException e) {

            throw new IOException(
                    "Tesseract OCR failed: " + e.getMessage(),
                    e
            );
        }

        if (extractedText.toString().isBlank()) {
            throw new IOException("No readable text found in PDF.");
        }

        return extractedText.toString().trim();
    }
}
