// Import libraries for file parsing
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

export interface ParsedFile {
  content: string;
  fileName: string;
  fileType: string;
  handler: string;
}

export interface FileTypeHandler {
  extensions: string[];
  mimeTypes?: string[];
  parse: (file: File) => Promise<string>;
  priority?: number;
  name: string;
}

export class FileParserRegistry {
  private handlers = new Map<string, FileTypeHandler>();
  private handlerNames = new Map<string, string>();

  register(handler: FileTypeHandler): void {
    handler.extensions.forEach(ext => {
      const extLower = ext.toLowerCase();
      this.handlers.set(extLower, handler);
      this.handlerNames.set(extLower, handler.name);
    });
  }

  getHandler(fileType: string): FileTypeHandler | null {
    return this.handlers.get(fileType.toLowerCase()) || null;
  }

  getHandlerName(fileType: string): string | null {
    return this.handlerNames.get(fileType.toLowerCase()) || null;
  }

  getSupportedExtensions(): string[] {
    return Array.from(this.handlers.keys());
  }

  isSupported(fileType: string): boolean {
    return this.handlers.has(fileType.toLowerCase());
  }
}

export class FileParser {
  private static registry = new FileParserRegistry();

  static initialize(): void {
    // Register built-in handlers
    this.registry.register(new TextFileHandler());
    this.registry.register(new CodeFileHandler());
    this.registry.register(new YamlFileHandler());
    this.registry.register(new JsonFileHandler());
    this.registry.register(new MarkdownFileHandler());
    this.registry.register(new DocxFileHandler());
    this.registry.register(new PDFFileHandler());
  }

  static async parseFile(file: File): Promise<ParsedFile> {
    const fileName = file.name;
    const fileType = fileName.split('.').pop()?.toLowerCase() || '';
    const fileTypeWithDot = '.' + fileType; // Add dot to match registry format
    
    const handler = this.registry.getHandler(fileTypeWithDot);
    if (!handler) {
      const supportedCount = this.registry.getSupportedExtensions().length;
      throw new Error(`Unsupported file type: ${fileTypeWithDot}. We support ${supportedCount} text-based file formats including documents, code files, configuration files, and data files. Please check our documentation for the complete list.`);
    }

    const content = await handler.parse(file);
    const handlerName = this.registry.getHandlerName(fileTypeWithDot);

    return {
      content,
      fileName,
      fileType,
      handler: handlerName || 'unknown'
    };
  }

  static getSupportedExtensions(): string[] {
    return this.registry.getSupportedExtensions();
  }

  static isSupported(fileType: string): boolean {
    return this.registry.isSupported(fileType);
  }
}

// Handler implementations
class TextFileHandler implements FileTypeHandler {
  extensions = ['.txt'];
  name = 'TextFileHandler';

  async parse(file: File): Promise<string> {
    return this.readFileAsText(file);
  }

  private readFileAsText(file: File): Promise<string> {
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
}

class CodeFileHandler implements FileTypeHandler {
  extensions = [
    '.ts', '.js', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', 
    '.rs', '.swift', '.kt', '.scala', '.r', '.sql', '.sh', '.ps1', '.bat', 
    '.dockerfile', '.gitignore', '.env', '.config', '.ini', '.xml', '.html', 
    '.css', '.scss', '.sass', '.less', '.vue', '.jsx', '.tsx', '.csv'
  ];
  name = 'CodeFileHandler';

  async parse(file: File): Promise<string> {
    const content = await this.readFileAsText(file);
    return content
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Failed to read code file'));
      reader.readAsText(file);
    });
  }
}

class YamlFileHandler implements FileTypeHandler {
  extensions = ['.yaml', '.yml'];
  name = 'YamlFileHandler';

  async parse(file: File): Promise<string> {
    const content = await this.readFileAsText(file);
    return this.preprocessYamlContent(content);
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Failed to read YAML file'));
      reader.readAsText(file);
    });
  }

  private preprocessYamlContent(content: string): string {
    // YAML files are text-based, so we can analyze them directly
    return content;
  }
}

class JsonFileHandler implements FileTypeHandler {
  extensions = ['.json'];
  name = 'JsonFileHandler';

  async parse(file: File): Promise<string> {
    const content = await this.readFileAsText(file);
    return this.preprocessJsonContent(content);
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Failed to read JSON file'));
      reader.readAsText(file);
    });
  }

  private preprocessJsonContent(content: string): string {
    // JSON files are text-based, so we can analyze them directly
    return content;
  }
}

class MarkdownFileHandler implements FileTypeHandler {
  extensions = ['.md', '.markdown'];
  name = 'MarkdownFileHandler';

  async parse(file: File): Promise<string> {
    const content = await this.readFileAsText(file);
    return this.preprocessMarkdownContent(content);
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Failed to read Markdown file'));
      reader.readAsText(file);
    });
  }

  private preprocessMarkdownContent(content: string): string {
    // Markdown files are text-based, so we can analyze them directly
    return content;
  }
}

class DocxFileHandler implements FileTypeHandler {
  extensions = ['.docx'];
  name = 'DocxFileHandler';

  async parse(file: File): Promise<string> {
    const arrayBuffer = await this.readFileAsArrayBuffer(file);
    return this.extractTextFromDocx(arrayBuffer);
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        resolve(arrayBuffer);
      };
      reader.onerror = () => reject(new Error('Failed to read DOCX file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private async extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      throw new Error('Failed to extract text from DOCX file');
    }
  }
}

class PDFFileHandler implements FileTypeHandler {
  extensions = ['.pdf'];
  name = 'PDFFileHandler';

  async parse(file: File): Promise<string> {
    const arrayBuffer = await this.readFileAsArrayBuffer(file);
    return this.extractTextFromPdf(arrayBuffer);
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        resolve(arrayBuffer);
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private async extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      // Set worker source for pdfjs-dist - use local worker file
      pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.mjs');
      
      // Load the PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items from the page
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      }
      
      // Clean and format the extracted text
      return this.preprocessPdfContent(fullText);
    } catch (error: unknown) {
      // Handle specific PDF errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
        throw new Error('This PDF is password-protected and cannot be processed');
      }
      if (errorMessage.includes('Invalid') || errorMessage.includes('corrupted')) {
        throw new Error('This file appears to be corrupted or is not a valid PDF');
      }
      throw new Error(`Failed to extract text from PDF file: ${errorMessage}`);
    }
  }

  private preprocessPdfContent(text: string): string {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid PDF text content - the PDF may be image-based or corrupted');
    }

    // Clean and format the extracted text
    let cleanedText = text
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive whitespace but preserve paragraph breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Trim excessive spaces
      .replace(/[ ]+/g, ' ')
      // Trim each line
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0) // Remove empty lines
      .join('\n')
      // Remove leading/trailing whitespace
      .trim();

    if (cleanedText.length === 0) {
      throw new Error('PDF contains no extractable text - it may be image-based or scanned');
    }

    return cleanedText;
  }
}

