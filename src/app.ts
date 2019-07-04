import Input from 'readline-sync';
import * as fs from 'fs';
import { execSync } from 'child_process';

async function createDir(path: string) {
    if (fs.existsSync(path)) {
        throw Error(`${path} already exist`);
    }
    fs.mkdirSync(path);
    fs.mkdirSync(`${path}/src`);
    fs.writeFileSync(`${path}/src/app.ts`, fs.readFileSync('./src/template/express.template'));
    fs.mkdirSync(`${path}/src/route`);
    fs.writeFileSync(`${path}/src/route/example.ts`, fs.readFileSync('./src/template/route.template'));
    fs.mkdirSync(`${path}/src/util`);
    fs.writeFileSync(`${path}/src/util/tool.ts`, fs.readFileSync('./src/template/tool.template'));

    fs.mkdirSync(`${path}/config`);
    fs.mkdirSync(`${path}/config/development`);
    fs.writeFileSync(`${path}/config/development/log.json`, JSON.stringify({
        "level": "debug"
    }, null, 4));
    fs.mkdirSync(`${path}/config/production`);
    fs.writeFileSync(`${path}/config/production/log.json`, JSON.stringify({
        "level": "info"
    }, null, 4));
}

async function initGit(path: string) {
    execSync('git init', { cwd: path });
    fs.writeFileSync(`${path}/.gitignore`, fs.readFileSync('./.gitignore'));
}

async function initNpm(path: string) {
    execSync('npm init -y', { cwd: path });

    const deps: string[] = ['source-map-support', 'express'];
    const devDeps: string[] = ['typescript', '@types/node', '@types/express'];

    const isLater = Input.keyInYNStrict('是否需要定时任务系统', { defaultInput: 'Y' });
    if (isLater) {
        deps.push('later');
        devDeps.push('@types/later');
        fs.mkdirSync(`${path}/src/cron`);
        fs.writeFileSync(`${path}/src/cron/schedule.ts`, fs.readFileSync('./src/template/schedule.template'));
    }

    const isBluebird = Input.keyInYNStrict('是否需要Bluebird', { defaultInput: 'Y' });
    if (isBluebird) {
        deps.push('bluebird');
        devDeps.push('@types/bluebird');
    }

    const isLodash = Input.keyInYNStrict('是否需要Lodash', { defaultInput: 'Y' });
    if (isLodash) {
        deps.push('lodash');
    }

    for(;;) {
        const isContinue = Input.keyInYNStrict('是否需要额外的包', { defaultInput: 'Y' });
        if (!isContinue) {
            break;
        }

        const pack = Input.question('请输入依赖包');
        if (pack) {
            deps.push(pack);
        }

        const devPack = Input.question('请输入依赖包的声明');
        if (devPack) {
            devDeps.push(devPack);
        }
    }

    execSync(`npm install --save ${deps.join(' ')}`, { cwd: path });
    execSync(`npm install --save-dev ${devDeps.join(' ')}`, { cwd: path });
    fs.writeFileSync(`${path}/tsconfig.json`, fs.readFileSync('./tsconfig.json'));
}

const path = process.argv[2] || 'express-ts';
createDir(path).then(() => {
    return initGit(path);
}).then(() => {
    return initNpm(path);
}).catch(e => {
    console.log(e);
});
