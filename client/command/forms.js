// jshint esversion: 6, node: true
"use strict";
const fs         = require('fs');
const inquirer   = require('inquirer');
const path       = require('path');
const fileformat = ["json", "csv"];


function mandatory(value) {
    return typeof value !== 'undefined' && value !== '' ? true : 'field mandatory';
}

function checkFile(file) {
    try {
        if (fs.statSync(file).isFile()) {
            return true
        }
    } catch (e) {
    }
    return "File not found";

}

async function question(message) {
    let result = await inquirer.prompt([
        {
            type   : "confirm",
            name   : "question",
            default: false,
            message
        }]
    ).catch(console.error);
    return result.question;
}

async function algorithm(values = {}) {
    let result = await inquirer.prompt([
        {
            name    : "name",
            default : values.name,
            message : "Name:",
            type    : "input",
            validate: mandatory
        },
        {
            name   : "description",
            default: values.description,
            message: "Description:",
            type   : "input"
        },
        {
            name   : "inputformat",
            default: values.inputformat,
            message: "Input format:",
            type   : "list",
            choices: fileformat
        },
        {
            name   : "outputformat",
            default: values.outputformat,
            message: "Output format:",
            type   : "list",
            choices: fileformat
        }
    ]);
    let choice = await inquirer.prompt([
        {
            name   : "editorOrFile",
            message: "Source from:",
            type   : "list",
            choices: values.source ? ["editor", "file path"] : ["file path", "editor"]
        }
    ]);
    if (choice.editorOrFile === 'editor') {
        result.source = (await inquirer.prompt([
            {
                name   : "source",
                default: values.source,
                message: "Source:",
                type   : "editor"
            }
        ])).source;
    } else {
        let file      = await inquirer.prompt([
            {
                name    : "path",
                message : "Path to file with the source code:",
                type    : "input",
                validate: checkFile
            }
        ]);
        result.source = fs.readFileSync(file.path).toString();
    }
    return result;
}

async function dataset(values = {}) {
    let result = await inquirer.prompt([
        {
            name    : "name",
            default : values.name,
            message : "Name:",
            type    : "input",
            validate: mandatory
        },
        {
            name   : "description",
            default: values.description,
            message: "Description:",
            type   : "input"
        },
        {
            name   : "format",
            default: values.format,
            message: "Input format:",
            type   : "list",
            choices: fileformat
        }
    ]);
    if (values.datafiles && values.datafiles.length) {
        result.datafiles4deleted = (await inquirer.prompt([
            {
                name   : "delete",
                message: "Do you want to delete some file?:",
                type   : "checkbox",
                choices: values.datafiles
            }
        ])).delete;
    }
    let first = true;
    while (await question('do you want to add ' + (first ? 'a' : 'another') + ' file?')) {
        if (first) {
            result.datafiles = [];
            first            = false;
        }
        let file = await inquirer.prompt([
            {
                name    : "path",
                message : "File path:",
                type    : "input",
                validate: checkFile
            }
        ]);
        result.datafiles.push({
            fileName   : path.basename(file.path),
            fileContent: fs.readFileSync(file.path, 'utf-8')
        });
    }
    return result;
}


function job(algorithms, datasets, values = {}) {
    return inquirer.prompt([
        {
            name    : "name",
            default : values.name,
            message : "Name:",
            type    : "input",
            validate: mandatory
        },
        {
            name   : "description",
            default: values.description,
            message: "Description:",
            type   : "input"
        },
        {
            name   : "algorithm",
            default: values.algorithm,
            message: "Algorithm:",
            type   : "list",
            choices: algorithms
        },
        {
            name   : "inputset",
            default: values.algorithm,
            message: "Input set:",
            type   : "list",
            choices: datasets
        },
        {
            name   : "resultset",
            default: values.algorithm,
            message: "Result set:",
            type   : "list",
            choices: datasets
        }
    ]);
}

module.exports = {
    question,
    algorithm,
    dataset,
    job
};