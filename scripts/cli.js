import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

function getCliOptionDefinitions() {
    /**@type commandLineArgs.OptionDefinition[] */
    const optionDefinitions = [
        {
            name: "help",
            alias: "h",
            type: Boolean,
            description: "Show command line help."
        },
        {
            name: "version",
            alias: "v",
            type: Boolean,
            description: "Print version information."
        },
        {
            name: "init",
            type: Boolean,
            description: "Initialize the project structure with sample content."
        },
        {
            name: "build",
            type: Boolean,
            description: "Build the project and prepare the deployable artifact."
        },
        {
            name: "watch",
            type: Boolean,
            description: "Rebuild the project when files under src/ change."
        },
        {
            name: "dev",
            type: Boolean,
            description: "Build the project and serve dist/ at http://localhost:3000."
        }
    ];

    return optionDefinitions;
}

function parseArgv() {
    const optionDefinitions = getCliOptionDefinitions();

    /** @type commandLineArgs.CommandLineOptions */
    const options = commandLineArgs(optionDefinitions);

    return options;
}

function help() {
    const optionDefinitions = getCliOptionDefinitions();

    /** @type commandLineUsage.Section */
    const commandSections = [{
        header: "Shevky",
        content: "A minimal, dependency-light static site generator."
    },
    {
        header: "Options",
        optionList: optionDefinitions
    },
    {
        header: "Project Details",
        content: "Project Home: {underline https://tatoglu.net/project/shevky}"
    },
    {
        content: "GitHub: {underline https://github.com/fatihtatoglu/shevky}"
    }];

    const usage = commandLineUsage(commandSections);
    return usage;
}

function version(version_number) {
    const version = commandLineUsage({
        header: "Shevky v" + version_number,
        content: "A minimal, dependency-light static site generator.",
    });

    return version;
}

const API = {
    options: parseArgv(),
    help: help,
    version: version
};

export default API;
