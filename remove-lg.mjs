import fs from 'fs';
import path from 'path';

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove import
    content = content.replace(/import\s+\{\s*LinearGradient\s*\}\s+from\s+['"\`]expo-linear-gradient['"\`];?\n?/g, '');
    content = content.replace(/import\s+\{\s*BlurView\s*\}\s+from\s+['"\`]expo-blur['"\`];?\n?/g, '');

    // Replace component names
    content = content.replace(/<LinearGradient/g, '<View');
    content = content.replace(/<\/LinearGradient>/g, '</View>');
    
    content = content.replace(/<BlurView/g, '<View');
    content = content.replace(/<\/BlurView>/g, '</View>');

    content = content.replace(/\bcolors=\{\[[\s\S]*?\]\}/g, '');
    content = content.replace(/\blocations=\{\[[\s\S]*?\]\}/g, '');
    content = content.replace(/\bstart=\{\{[\s\S]*?\}\}/g, '');
    content = content.replace(/\bend=\{\{[\s\S]*?\}\}/g, '');
    content = content.replace(/\btint=['"\`][^'"\`]+['"\`]/g, '');
    content = content.replace(/\bintensity=\{[^\}]+\}/g, '');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Processed ' + filePath);
    }
}

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

processDir('c:/projects/my-app/src');
processDir('c:/projects/my-app/app');
