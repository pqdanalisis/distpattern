// jshint esversion: 6, node: true
"use strict";

//TODO: cambiar la base de datos por el filesystem para la gestión

require('../log');

const pify          = require('pify');
const fs            = pify(require('fs'));
const path          = require('path');
const getConnection = require('../db');
const config        = require('../config.json');

module.exports = {
    lst   : async (folder, link) => {
        try {
            let folderComplete = path.join(__dirname, config.rootFolder, folder);
            let result = [];
            if (fs.existsSync(folderComplete)) {
                result = fs.readdirSync(folderComplete);
                if (link) {
                    result = result.map((file) => config.urlFiles + folder + '/' + file);
                }
            }
            return result;
        } catch (e) {
            error(e);
            return false;
        }
    },
    get   : async(folder, name) => {
        return config.urlFiles + folder + '/' + name;
    },
    add   : async (folder, name, tmpFile, keep) => {
        try {
            let pathto = path.join(__dirname, config.rootFolder, folder);
            if (!fs.existsSync(pathto)) {
                await fs.mkdir(pathto);
            }
            let filePath = path.join(pathto, name);
            if (keep) {
                copyFileSync(tmpFile, filePath);
            } else {
                await fs.rename(tmpFile, filePath);
            }
            return true;
        } catch(err) {
            error(err);
            return false;
        }
    },
    del   : async (folder, name) => {
        try {
            let folderComplete = path.join(__dirname, config.rootFolder, folder, name);
            if (fs.existsSync(folderComplete)) {
                await fs.unlink(folderComplete);
                return true
            }
            return false;
        } catch(err) {
            error(err);
            return false;
        }
    },
    remove: (folder) => {
        return deleteFolderRecursive(path.join(__dirname, config.rootFolder, folder));
    }
};

async function deleteFolderRecursive(folder) {
    try {
        if (fs.existsSync(folder)) {
            for (let file of await fs.readdir(folder)) {
                let curPath = path.join(folder, file);
                if ((await fs.lstat(curPath)).isDirectory()) { // recurse
                    deleteFolderRecursive(curPath);
                } else { // delete file
                    await fs.unlink(curPath);
                }
            }
            await fs.rmdir(folder);
            return true;
        }
        return false;
    } catch (err) {
        error(err);
        return false;
    }
}

function copyFileSync (srcFile, destFile, options = {}) {
    const BUF_LENGTH = 64 * 1024
    const _buff = Buffer.alloc(BUF_LENGTH)

    const overwrite = options.overwrite || true;
    const errorOnExist = options.errorOnExist || false;
    const preserveTimestamps = options.preserveTimestamps || true;

    if (fs.existsSync(destFile)) {
        if (overwrite) {
            fs.unlinkSync(destFile);
        } else if (errorOnExist) {
            throw new Error(`${destFile} already exists`);
        } else return;
    }

    const fdr = fs.openSync(srcFile, 'r');
    const stat = fs.fstatSync(fdr);
    const fdw = fs.openSync(destFile, 'w', stat.mode);
    let bytesRead = 1;
    let pos = 0;

    while (bytesRead > 0) {
        bytesRead = fs.readSync(fdr, _buff, 0, BUF_LENGTH, pos);
        fs.writeSync(fdw, _buff, 0, bytesRead);
        pos += bytesRead;
    }

    if (preserveTimestamps) {
        fs.futimesSync(fdw, stat.atime, stat.mtime);
    }

    fs.closeSync(fdr);
    fs.closeSync(fdw);
}