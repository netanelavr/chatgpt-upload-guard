import mammoth from 'mammoth';

export interface ParsedFile {
  content: string;
  fileName: string;
  fileType: string;
}

export class FileParser {
  static async parseFile(file: File): Promise<ParsedFile> {
    const fileName = file.name;
    const fileType = fileName.split('.').pop()?.toLowerCase() || '';
    
    let content: string;
    
    switch (fileType) {
      case 'txt':
        content = await this.parseTxt(file);
        break;
      case 'docx':
        content = await this.parseDocx(file);
        break;
      case 'pdf':
        content = await this.parsePdf(file);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    return {
      content,
      fileName,
      fileType
    };
  }
  
  private static async parseTxt(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }
  
  private static async parseDocx(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(result.value);
        } catch (error) {
          reject(new Error('Failed to parse DOCX file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read DOCX file'));
      reader.readAsArrayBuffer(file);
    });
  }
  
  private static async parsePdf(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Simple PDF text extraction using basic parsing
          // This is a basic implementation - for production, consider using PDF.js
          const text = await this.extractPdfText(uint8Array);
          resolve(text);
        } catch (error) {
          reject(new Error('Failed to parse PDF file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  }
  
  private static async extractPdfText(data: Uint8Array): Promise<string> {
    // Basic PDF text extraction
    // Convert bytes to string and extract text between BT and ET markers
    const decoder = new TextDecoder('latin1');
    const pdfString = decoder.decode(data);
    
    const textRegex = /BT\s+(.*?)\s+ET/gs;
    const matches = pdfString.match(textRegex);
    
    if (!matches) {
      throw new Error('No text content found in PDF');
    }
    
    let extractedText = '';
    for (const match of matches) {
      // Extract text from PDF commands
      const textContent = match.replace(/BT|ET/g, '')
        .replace(/\/\w+\s+\d+(\.\d+)?\s+Tf/g, '') // Remove font commands
        .replace(/\d+(\.\d+)?\s+\d+(\.\d+)?\s+Td/g, '') // Remove positioning
        .replace(/\d+(\.\d+)?\s+TL/g, '') // Remove line spacing
        .replace(/\[|\]/g, '') // Remove array brackets
        .replace(/\(([^)]+)\)/g, '$1') // Extract text from parentheses
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      if (textContent) {
        extractedText += textContent + ' ';
      }
    }
    
    if (!extractedText.trim()) {
      throw new Error('No readable text content found in PDF');
    }
    
    return extractedText.trim();
  }
}