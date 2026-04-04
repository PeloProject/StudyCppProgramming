const code = `#include <iostream>
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

      const startIdx = code.indexOf('void processOrder');
      const endIdx = code.indexOf('int main()');
      
      console.log('startIdx', startIdx);
      console.log('endIdx', endIdx);
      if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
         const processOrderBody = code.substring(startIdx, endIdx);
         console.log('processOrderBody:', processOrderBody);
         console.log('-----------------');
         const cleanBody = processOrderBody.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
         console.log('cleanBody:', cleanBody);
         console.log('-----------------');
         
         if (!cleanBody.includes('printReceipt')) {
            console.log("ERROR! Not found");
         } else {
             console.log("SUCCESS! Found");
         }
      }
