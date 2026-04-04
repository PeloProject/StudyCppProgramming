const code2 = `#include <iostream>
#include <vector>

void printReceipt(double total)
{
    std::cout << "Total: $" << total << std::endl;
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

// ---------------------------------------------------------
// You don't need to change main() for this exercise.
// The test framework will call your functions directly.
int main() {
    std::vector<double> myPrices = {10.5, 20.0, 5.25};
    processOrder(myPrices);
    return 0;
}`;

function validate(code) {
      const startIdx = code.indexOf('void processOrder');
      const endIdx = code.indexOf('int main()');
      
      console.log('startIdx', startIdx);
      console.log('endIdx', endIdx);
      
      if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
         const processOrderBody = code.substring(startIdx, endIdx);
         console.log('RAW BODY:', processOrderBody);
         // Strip C++ comments to prevent false positives from TODOs
         const cleanBody = processOrderBody.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
         console.log('CLEAN BODY:', cleanBody);
         
         if (!cleanBody.includes('printReceipt')) {
            return "Test Failed: You need to call printReceipt inside the processOrder function to complete the refactoring.";
         }
         if (cleanBody.includes('cout')) {
            return "Test Failed: processOrder should no longer contain std::cout. All printing should be delegated to printReceipt.";
         }
      } else {
         return "Could not find processOrder or main";
      }
      return null;
}

console.log('Result for valid code: ', validate(code2));
