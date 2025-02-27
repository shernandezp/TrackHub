const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src'); // Adjust the path to your React app's source directory

const newHeader = `/**
* Copyright (c) 2025 Sergio Hernandez. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License").
*  You may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/\n\n`;

const argonHeader = `/**
=========================================================
* Argon Dashboard 2 MUI - v3.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-material-ui
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/`;

function updateHeaders(filePath) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading file ${filePath}:`, err);
            return;
        }

        let updatedData;
        if (data.includes(argonHeader)) {
            if (!data.includes(newHeader)) {
                updatedData = data.replace(argonHeader, `${argonHeader}\n${newHeader}`);
            }
        } else {
            updatedData = `${newHeader}${data}`;
        }

        if (updatedData) {
            fs.writeFile(filePath, updatedData, 'utf8', (err) => {
                if (err) {
                    console.error(`Error writing file ${filePath}:`, err);
                } else {
                    console.log(`Updated file ${filePath}`);
                }
            });
        }
    });
}

function traverseDirectory(directory) {
    fs.readdir(directory, (err, files) => {
        if (err) {
            console.error(`Error reading directory ${directory}:`, err);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(directory, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(`Error stating file ${filePath}:`, err);
                    return;
                }

                if (stats.isDirectory()) {
                    traverseDirectory(filePath);
                } else if (filePath.endsWith('.js')) {
                    updateHeaders(filePath);
                }
            });
        });
    });
}

traverseDirectory(directoryPath);