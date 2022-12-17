const fsPromise = require("fs").promises;

class FileUtility {
    static async readJsonFile(path) {
        return JSON.parse(await fsPromise.readFile(path));
    }

    static async writeJsonFile(path, content) {
        return fsPromise.writeFile(path, JSON.stringify(content, "\t"));
    }
}

module.exports = FileUtility;