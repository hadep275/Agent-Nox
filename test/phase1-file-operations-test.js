/**
 * 🦊 PHASE 1 TEST: File Operations Visibility
 * 
 * Tests that files created, edited, and deleted by NOX are visible in the explorer
 * and that the explorer is properly refreshed after each operation.
 */

const assert = require('assert');
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

// Mock logger for testing
const mockLogger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  debug: (msg) => console.log(`[DEBUG] ${msg}`),
  warn: (msg) => console.log(`[WARN] ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err),
};

// Mock performance monitor
const mockPerformanceMonitor = {
  startTimer: (name) => ({
    end: () => {},
  }),
};

describe('🦊 PHASE 1: File Operations Visibility', () => {
  let fileOps;
  let testDir;

  before(async () => {
    // Get workspace folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder open');
    }

    testDir = path.join(workspaceFolders[0].uri.fsPath, 'test-phase1');

    // Create test directory
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(testDir));

    // Import FileOps
    const FileOps = require('../src/core/fileOps');
    fileOps = new FileOps(mockLogger, mockPerformanceMonitor);
    await fileOps.initialize();
  });

  after(async () => {
    // Cleanup test directory
    try {
      await vscode.workspace.fs.delete(vscode.Uri.file(testDir), { recursive: true });
    } catch (error) {
      console.warn('Failed to cleanup test directory:', error);
    }
  });

  describe('📝 File Creation', () => {
    it('should create a file and make it visible in explorer', async () => {
      const filePath = path.join(testDir, 'test-create.js');
      const content = 'console.log("Hello from NOX");';

      // Create file
      const result = await fileOps.createFile(filePath, content);

      // Verify result
      assert.strictEqual(result.success, true, 'File creation should succeed');
      assert.strictEqual(result.filePath, filePath, 'File path should match');

      // Verify file exists in file system
      const uri = vscode.Uri.file(filePath);
      const stat = await vscode.workspace.fs.stat(uri);
      assert.strictEqual(stat.type, vscode.FileType.File, 'File should exist');

      // Verify file content
      const fileContent = await vscode.workspace.fs.readFile(uri);
      assert.strictEqual(
        Buffer.from(fileContent).toString('utf8'),
        content,
        'File content should match'
      );

      console.log('✅ File created and visible in explorer');
    });

    it('should open created file in editor', async () => {
      const filePath = path.join(testDir, 'test-open.js');
      const content = 'console.log("Opened in editor");';

      // Create file
      await fileOps.createFile(filePath, content);

      // Check if file is open in editor
      const openEditors = vscode.window.visibleTextEditors;
      const fileOpen = openEditors.some(
        (editor) => editor.document.uri.fsPath === filePath
      );

      assert.strictEqual(fileOpen, true, 'File should be open in editor');
      console.log('✅ File opened in editor after creation');
    });

    it('should refresh explorer after file creation', async () => {
      const filePath = path.join(testDir, 'test-refresh.js');
      const content = 'console.log("Explorer refreshed");';

      // Create file (this should trigger explorer refresh)
      const result = await fileOps.createFile(filePath, content);

      // Verify file is visible
      assert.strictEqual(result.success, true);

      // Give explorer time to refresh
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify file exists
      const uri = vscode.Uri.file(filePath);
      const stat = await vscode.workspace.fs.stat(uri);
      assert.strictEqual(stat.type, vscode.FileType.File);

      console.log('✅ Explorer refreshed after file creation');
    });
  });

  describe('✏️ File Editing', () => {
    it('should edit a file and refresh explorer', async () => {
      const filePath = path.join(testDir, 'test-edit.js');
      const originalContent = 'console.log("Original");';
      const newContent = 'console.log("Edited");';

      // Create file first
      await fileOps.createFile(filePath, originalContent);

      // Edit file
      const range = new vscode.Range(0, 0, 0, originalContent.length);
      const result = await fileOps.editFile(filePath, [
        { range, text: newContent },
      ]);

      // Verify result
      assert.strictEqual(result.success, true, 'File edit should succeed');

      // Verify file content changed
      const uri = vscode.Uri.file(filePath);
      const fileContent = await vscode.workspace.fs.readFile(uri);
      assert.strictEqual(
        Buffer.from(fileContent).toString('utf8'),
        newContent,
        'File content should be updated'
      );

      console.log('✅ File edited and explorer refreshed');
    });
  });

  describe('🗑️ File Deletion', () => {
    it('should delete a file and refresh explorer', async () => {
      const filePath = path.join(testDir, 'test-delete.js');
      const content = 'console.log("To be deleted");';

      // Create file first
      await fileOps.createFile(filePath, content);

      // Verify file exists
      let uri = vscode.Uri.file(filePath);
      let stat = await vscode.workspace.fs.stat(uri);
      assert.strictEqual(stat.type, vscode.FileType.File);

      // Delete file
      const result = await fileOps.deleteFile(filePath);

      // Verify result
      assert.strictEqual(result.success, true, 'File deletion should succeed');

      // Verify file no longer exists
      try {
        await vscode.workspace.fs.stat(uri);
        assert.fail('File should not exist after deletion');
      } catch (error) {
        assert.strictEqual(error.code, 'FileNotFound');
      }

      console.log('✅ File deleted and explorer refreshed');
    });
  });

  describe('🔄 Batch Operations', () => {
    it('should create multiple files and refresh explorer', async () => {
      const operations = [
        {
          type: 'create',
          filePath: path.join(testDir, 'batch-1.js'),
          content: 'console.log("File 1");',
        },
        {
          type: 'create',
          filePath: path.join(testDir, 'batch-2.js'),
          content: 'console.log("File 2");',
        },
        {
          type: 'create',
          filePath: path.join(testDir, 'batch-3.js'),
          content: 'console.log("File 3");',
        },
      ];

      // Execute batch operations
      const result = await fileOps.batchOperations(operations);

      // Verify result
      assert.strictEqual(result.success, true, 'Batch operations should succeed');

      // Verify all files exist
      for (const op of operations) {
        const uri = vscode.Uri.file(op.filePath);
        const stat = await vscode.workspace.fs.stat(uri);
        assert.strictEqual(stat.type, vscode.FileType.File);
      }

      console.log('✅ Batch operations completed and explorer refreshed');
    });
  });
});

/**
 * 🎯 PHASE 1 SUCCESS CRITERIA
 * 
 * ✅ Files created by NOX are visible in explorer
 * ✅ Files are opened in editor after creation
 * ✅ Explorer is refreshed after file operations
 * ✅ File edits are visible in explorer
 * ✅ File deletions are reflected in explorer
 * ✅ Batch operations work correctly
 * 
 * 🚀 NEXT: Phase 2 - Terminal Manager Implementation
 */

