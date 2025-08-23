#!/usr/bin/env ts-node
import fs from 'fs';
import {
    resolveBacklogPath,
    updateBacklogDashboard,
    updateBacklogFile,
} from '../src/tools/backlogProgress';

function main(): void {
    const args = process.argv.slice(2);
    const write = args.includes('--write');
    const fileArgIdx = args.findIndex((a) => a === '--file');
    const file = fileArgIdx !== -1 ? args[fileArgIdx + 1] : undefined;
    const backlogPath = resolveBacklogPath(process.cwd(), file);
    if (write) {
        updateBacklogFile(backlogPath);
        // eslint-disable-next-line no-console
        console.log(`Updated dashboard in ${backlogPath}`);
    } else {
        const md = fs.readFileSync(backlogPath, 'utf8');
        const updated = updateBacklogDashboard(md);
        // eslint-disable-next-line no-console
        console.log(updated);
    }
}

main();
