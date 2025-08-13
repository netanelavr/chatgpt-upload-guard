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
      default:
        throw new Error(`Unsupported file type: ${fileType}. Supported formats: txt, docx`);
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

}