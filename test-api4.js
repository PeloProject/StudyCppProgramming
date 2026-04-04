const code = `
#define main user_main
#include <iostream>
#include <vector>

void printReceipt(double total)
{
    std::cout << "--- Receipt ---" << std::endl;
    std::cout << "Total: $" << total << std::endl;
    std::cout << "---------------" << std::endl;
}

void processOrder(const std::vector<double>& prices) {
    // 1. Calculate total
    double total = 0.0;
    for (double price : prices) {
        total += price;
    }

    // 2. Print receipt
    // TODO: Extract this part into a separate function printReceipt(double total)
    printReceipt(total);
}

int main() {
    std::vector<double> myPrices = {10.5, 20.0, 5.25};
    processOrder(myPrices);
    return 0;
}
#undef main
// --- TEST CODE (Hidden from user) ---
#include <iostream>
#include <sstream>
#include <cassert>

// Simple test to verify printReceipt exists and outputs correctly
int main() {
    std::stringstream buffer;
    std::streambuf* old = std::cout.rdbuf(buffer.rdbuf());
    
    // Call the newly extracted function
    printReceipt(35.75);
    
    std::cout.rdbuf(old);
    std::string output = buffer.str();
    
    if (output.find("Total: $35.75") != std::string::npos) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    } else {
        std::cout << "TEST_FAILED: Output was [" << output << "]" << std::endl;
        return 1;
    }
}
`;

fetch('https://wandbox.org/api/compile.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        code: code,
        compiler: 'gcc-head',
        save: false,
    })
}).then(res => res.json()).then(res => console.log(JSON.stringify(res, null, 2)));
