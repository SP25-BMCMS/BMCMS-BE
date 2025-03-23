// Swagger Test Script
// This script can be used to test the Swagger configuration

const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = 'http://localhost:3000';
const SWAGGER_URL = `${BASE_URL}/api`;
const SWAGGER_JSON_URL = `${BASE_URL}/api-json`;

async function testSwaggerEndpoints() {
    console.log(chalk.blue('Testing Swagger Configuration...'));

    try {
        // Test Swagger UI
        console.log(chalk.yellow('Testing Swagger UI endpoint...'));
        const uiResponse = await axios.get(SWAGGER_URL);
        if (uiResponse.status === 200) {
            console.log(chalk.green('✓ Swagger UI is accessible at:'), chalk.cyan(SWAGGER_URL));
        }
    } catch (error) {
        console.log(chalk.red('✗ Swagger UI is not accessible:'), error.message);
    }

    try {
        // Test Swagger JSON
        console.log(chalk.yellow('Testing Swagger JSON endpoint...'));
        const jsonResponse = await axios.get(SWAGGER_JSON_URL);
        if (jsonResponse.status === 200) {
            console.log(chalk.green('✓ Swagger JSON is accessible at:'), chalk.cyan(SWAGGER_JSON_URL));

            // Basic validation of Swagger JSON
            const swaggerJson = jsonResponse.data;
            console.log(chalk.yellow('Validating Swagger JSON...'));

            if (swaggerJson.openapi) {
                console.log(chalk.green(`✓ OpenAPI version: ${swaggerJson.openapi}`));
            }

            if (swaggerJson.info && swaggerJson.info.title) {
                console.log(chalk.green(`✓ API Title: ${swaggerJson.info.title}`));
            }

            if (swaggerJson.paths) {
                const pathCount = Object.keys(swaggerJson.paths).length;
                console.log(chalk.green(`✓ Paths found: ${pathCount}`));

                // Show top 5 paths as example
                const paths = Object.keys(swaggerJson.paths).slice(0, 5);
                console.log(chalk.cyan('Example paths:'));
                paths.forEach(path => {
                    console.log(chalk.cyan(`  - ${path}`));
                });

                if (pathCount > 5) {
                    console.log(chalk.cyan(`  ... and ${pathCount - 5} more`));
                }
            }

            if (swaggerJson.tags) {
                console.log(chalk.green(`✓ Tags found: ${swaggerJson.tags.length}`));
                console.log(chalk.cyan('Tags:'));
                swaggerJson.tags.forEach(tag => {
                    console.log(chalk.cyan(`  - ${tag.name}: ${tag.description}`));
                });
            }
        }
    } catch (error) {
        console.log(chalk.red('✗ Swagger JSON is not accessible:'), error.message);
    }

    console.log(chalk.blue('\nSwagger test completed'));
}

// Run the test
testSwaggerEndpoints().catch(error => {
    console.error(chalk.red('Error testing Swagger:'), error.message);
}); 