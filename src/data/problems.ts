// src/data/problems.ts
export type ProblemCategory =
  | "Refactoring"
  | "Design Patterns"
  | "Effective C++"
  | "C++の基礎"
  | "Game Programming"
  | "数学";

export type ProblemMode = "normal" | "fill-in-the-blank" | "guided";

export interface Problem {
  id: string;
  title: string;
  description: string;
  task: string;
  initialCode: string;
  testCode: string; // The code concatenated at the bottom to verify the user's implementation
  category: ProblemCategory;
  hint?: string;
  solution?: string;
  clientValidation?: (code: string) => string | null; // Regex/string validation before sending to API
  difficulty?: 1 | 2 | 3;
  estimatedMinutes?: number;
  skills?: string[];
  prerequisites?: string[];
  hintSteps?: string[];
  successMessage?: string;
  reviewAfterDays?: number;
  mode?: ProblemMode;
  templateSteps?: string[];
  starterCode?: string;
}

export interface LearningProblem extends Omit<Problem, "difficulty" | "estimatedMinutes" | "skills" | "prerequisites" | "hintSteps" | "successMessage" | "reviewAfterDays" | "mode" | "templateSteps"> {
  difficulty: 1 | 2 | 3;
  estimatedMinutes: number;
  skills: string[];
  prerequisites: string[];
  hintSteps: string[];
  successMessage: string;
  reviewAfterDays: number;
  mode: ProblemMode;
  templateSteps: string[];
  starterCode?: string;
}

const rawProblems: Problem[] = [
  {
    id: "extract-function",
    category: "Refactoring",
    title: "1. 関数の抽出 (Extract Function)",
    description: "現在のコードでは、合計金額の計算とレシートの印刷を一つの長い関数の中で行っています。",
    task: "レシートの印刷ロジックを `printReceipt(double total)` という名前の別の関数に抽出してください。この関数は、標準出力に 'Total: $<total>' と出力する必要があります。",
    initialCode: `#include <iostream>
#include <vector>

void processOrder(const std::vector<double>& prices) {
    // 1. 合計金額を計算
    double total = 0.0;
    for (double price : prices) {
        total += price;
    }

    // 2. レシートを印刷
    // TODO: この部分を printReceipt(double total) という別の関数に抽出してください
    std::cout << "--- Receipt ---" << std::endl;
    std::cout << "Total: $" << total << std::endl;
    std::cout << "---------------" << std::endl;
}

// ---------------------------------------------------------
// この演習では main() を変更する必要はありません。
// テストフレームワークがあなたの関数を直接呼び出します。
int main() {
    std::vector<double> myPrices = {10.5, 20.0, 5.25};
    processOrder(myPrices);
    return 0;
}
`,
    testCode: `
// --- テストコード (ユーザーには非表示) ---
#include <iostream>
#include <sstream>
#include <cassert>

// printReceipt が存在し、正しく出力されるかを確認する簡単なテスト
int main() {
    std::stringstream buffer;
    std::streambuf* old = std::cout.rdbuf(buffer.rdbuf());
    
    // 新しく抽出された関数を呼び出す
    printReceipt(35.75);
    
    std::cout.rdbuf(old);
    std::string output = buffer.str();
    
    if (output.find("Total: $35.75") != std::string::npos) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    } else {
        std::cout << "TEST_FAILED: 出力は [" << output << "] でした" << std::endl;
        return 1;
    }
}
`,
    hint: "1. `void printReceipt(double total)` というプロトタイプで新しい関数を作成します。 2. `processOrder` 内の `std::cout` を使っている部分をその関数に移動します。 3. `processOrder` から `printReceipt(total);` を呼び出すように書き換えます。",
    solution: `void printReceipt(double total) {
    std::cout << "--- Receipt ---" << std::endl;
    std::cout << "Total: $" << total << std::endl;
    std::cout << "---------------" << std::endl;
}

void processOrder(const std::vector<double>& prices) {
    double total = 0.0;
    for (double price : prices) {
        total += price;
    }
    printReceipt(total);
}`,
    clientValidation: (code: string) => {
      // Strip C++ comments to prevent false positives
      const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
      
      // Find the content of processOrder. 
      // We look from 'void processOrder' until the start of 'int main' to be safe.
      const startIdx = cleanCode.indexOf('void processOrder');
      const endIdx = cleanCode.indexOf('int main');
      
      if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
         const processOrderBlock = cleanCode.substring(startIdx, endIdx);
         
         if (!processOrderBlock.includes('printReceipt')) {
            return "テスト失敗: リファクタリングを完了するには、`processOrder` 関数内で `printReceipt` を呼び出す必要があります。";
         }
         if (processOrderBlock.includes('cout')) {
            return "テスト失敗: `processOrder` に `std::cout` を含めてはいけません。すべての出力は `printReceipt` に委譲する必要があります。";
         }
      }
      return null;
    }
  },
  {
    id: "strategy-pattern",
    category: "Design Patterns",
    title: "2. Strategy パターン (Strategy Pattern)",
    description: "`PaymentProcessor` クラスは現在、異なる支払い方法に対してハードコードされた if-else 文を使用しています。これは「開放閉鎖の原則 (Open-Closed Principle)」に違反しています。",
    task: "Strategy パターンを使用してコードをリファクタリングしてください。`void pay(int amount)` メソッドを持つインターフェース `PaymentStrategy` を作成してください。`CreditCardStrategy` と `PayPalStrategy` を実装してください。`PaymentProcessor` が `PaymentStrategy` を受け取るように更新してください。",
    initialCode: `#include <iostream>
#include <string>

// --- TODO: Strategy パターンを使用してリファクタリングしてください ---

// 1. PaymentStrategy インターフェース (抽象クラス) を作成します
// 2. CreditCardStrategy クラスと PayPalStrategy クラスを作成します
// 3. enum/if-else の代わりに Strategy を使用するように PaymentProcessor を更新します

enum class PaymentType {
    CreditCard,
    PayPal
};

class PaymentProcessor {
public:
    void processPayment(PaymentType type, int amount) {
        if (type == PaymentType::CreditCard) {
            std::cout << "Paid " << amount << " using Credit Card." << std::endl;
        } else if (type == PaymentType::PayPal) {
            std::cout << "Paid " << amount << " using PayPal." << std::endl;
        }
    }
};

int main() {
    PaymentProcessor processor;
    processor.processPayment(PaymentType::CreditCard, 100);
    processor.processPayment(PaymentType::PayPal, 50);
    return 0;
}
`,
    testCode: `
// --- テストコード (ユーザーには非表示) ---
#include <iostream>
#include <sstream>
#include <memory>
#include <type_traits>

int main() {
    // 1. PaymentStrategy が存在し、ポリモーフィックであるかを確認
    if constexpr (!std::is_polymorphic_v<PaymentStrategy>) {
        std::cout << "TEST_FAILED: PaymentStrategy 抽象クラスが見つからないか、ポリモーフィックではありません。" << std::endl;
        return 1;
    }
    
    std::stringstream buffer;
    std::streambuf* old = std::cout.rdbuf(buffer.rdbuf());
    
    // 2. Credit Card Strategy のテスト
    std::unique_ptr<PaymentStrategy> cc = std::make_unique<CreditCardStrategy>();
    cc->pay(150);
    
    // 3. PayPal Strategy のテスト
    std::unique_ptr<PaymentStrategy> pp = std::make_unique<PayPalStrategy>();
    pp->pay(75);
    
    std::cout.rdbuf(old);
    std::string output = buffer.str();
    
    if (output.find("Credit Card") != std::string::npos && output.find("PayPal") != std::string::npos && output.find("150") != std::string::npos) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    } else {
         std::cout << "TEST_FAILED: 出力が正しくありません。ストラテジーが正しいテキストを出力しているか確認してください。" << std::endl;
         return 1;
    }
}
`,
    hint: "1. `PaymentStrategy` 基底クラスを作り、`virtual void pay(int amount) = 0;` を定義します。 2. `CreditCardStrategy` と `PayPalStrategy` でそれを継承・実装します。 3. `PaymentProcessor` は引数として `PaymentStrategy` のポインタや参照を受け取るようにします。",
    solution: `class PaymentStrategy {
public:
    virtual ~PaymentStrategy() {}
    virtual void pay(int amount) = 0;
};

class CreditCardStrategy : public PaymentStrategy {
public:
    void pay(int amount) override {
        std::cout << "Paid " << amount << " using Credit Card." << std::endl;
    }
};

class PayPalStrategy : public PaymentStrategy {
public:
    void pay(int amount) override {
        std::cout << "Paid " << amount << " using PayPal." << std::endl;
    }
};

class PaymentProcessor {
public:
    void processPayment(PaymentStrategy& strategy, int amount) {
        strategy.pay(amount);
    }
};`,
  },
  {
    id: "effective-cpp-item-20",
    category: "Effective C++",
    title: "3. Effective C++ 項20 (Item 20)",
    description: "項20: 値渡し (pass-by-value) よりも、定数参照渡し (pass-by-reference-to-const) を優先してください。オブジェクトを値渡しするとコストが高く、「スライシング問題 (slicing problem)」(派生クラスのオブジェクトを渡した際に基底クラスの部分だけがコピーされる問題) が発生する可能性があります。",
    task: "`printNameAndDisplay` が `Window` オブジェクトを「値渡し」ではなく `const Window&` で受け取るようにリファクタリングしてください。これによりスライシング問題が解決し、ポリモーフィズムが正しく機能するようになります。",
    initialCode: `#include <iostream>
#include <string>

class Window {
public:
    virtual std::string name() const { return "Generic Window"; }
    virtual void display() const { std::cout << "Displaying Window" << std::endl; }
    virtual ~Window() {}
};

class WindowWithScrollBars : public Window {
public:
    std::string name() const override { return "Window with ScrollBars"; }
    void display() const override { std::cout << "Displaying Window with ScrollBars" << std::endl; }
};

// --- TODO: この関数を 'const Window& w' を受け取るようにリファクタリングしてください ---
void printNameAndDisplay(Window w) {
    std::cout << w.name() << std::endl;
    w.display();
}

int main() {
    WindowWithScrollBars wwsb;
    printNameAndDisplay(wwsb);
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <string>
#include <sstream>

int main() {
    WindowWithScrollBars wwsb;
    
    std::stringstream buffer;
    std::streambuf* old = std::cout.rdbuf(buffer.rdbuf());
    
    printNameAndDisplay(wwsb);
    
    std::cout.rdbuf(old);
    std::string output = buffer.str();
    
    if (output.find("ScrollBars") != std::string::npos) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    } else {
        std::cout << "TEST_FAILED: スライシングが発生しました！ ウィンドウにスクロールバーが表示されませんでした。参照を使用しましたか？" << std::endl;
        return 1;
    }
}
`,
    hint: "1. `void printNameAndDisplay(Window w)` を `void printNameAndDisplay(const Window& w)` に書き換えます。 2. これにより、オブジェクトのコピー（スライシング）を防ぎ、ポリモーフィズムが機能するようになります。",
    solution: `void printNameAndDisplay(const Window& w) {
    std::cout << w.name() << std::endl;
    w.display();
}`,
    clientValidation: (code: string) => {
      const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
      if (!cleanCode.includes('const Window&')) {
        return "テスト失敗: スライシングを避け、効率を向上させるために、オブジェクトを `const Window&` で渡す必要があります。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-02",
    category: "Effective C++",
    title: "4. Effective C++ 項02 (Item 02)",
    description: "項02: #define よりも const、enum、inline を優先してください。マクロはスコープを守らず、コンパイラのシンボルテーブルからも見えないため、デバッグが困難になります。",
    task: "`#define ASPECT_RATIO` を `const double AspectRatio` に置き換えてください。これにより、定数が型を持ち、スコープを尊重するようになります。",
    initialCode: `#include <iostream>

#define ASPECT_RATIO 1.653

int main() {
    std::cout << "Aspect Ratio: " << ASPECT_RATIO << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <string>

int main() {
    // ASPECT_RATIO マクロがまだ定義されているかチェック
#ifdef ASPECT_RATIO
    std::cout << "TEST_FAILED: #define ASPECT_RATIO がまだ存在します。" << std::endl;
    return 1;
#endif

    // ランタイム時に定数の存在を確認するのは難しいですが、
    // クライアントバリデーションでソースコードをチェックします。
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `#define ASPECT_RATIO 1.653` を削除します。 2. `const double AspectRatio = 1.653;` を定義します。 3. `main` 関数内の変数名も修正した定数名に合わせて変更します。",
    solution: `const double AspectRatio = 1.653;

int main() {
    std::cout << "Aspect Ratio: " << AspectRatio << std::endl;
    return 0;
}`,
    clientValidation: (code: string) => {
      if (code.includes("#define ASPECT_RATIO")) {
        return "テスト失敗: #define ASPECT_RATIO を削除する必要があります。";
      }
      if (!code.includes("const double AspectRatio")) {
        return "テスト失敗: 'const double AspectRatio' を定義する必要があります。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-03",
    category: "Effective C++",
    title: "5. Effective C++ 項03 (Item 03)",
    description: "項03: 可能な限り const を使ってください。メンバ関数を const と宣言することで、その関数がオブジェクトの状態を変更しないことをコンパイラとユーザーに伝えます。",
    task: "`TextBlock` クラスの `getText` メソッドを `const` メンバ関数にして、`const TextBlock` オブジェクトから呼び出せるようにしてください。",
    initialCode: `#include <iostream>
#include <string>

class TextBlock {
public:
    TextBlock(std::string text) : text(text) {}
    
    // --- TODO: このメソッドを const にしてください ---
    std::string getText() {
        return text;
    }

private:
    std::string text;
};

void printText(const TextBlock& tb) {
    std::cout << tb.getText() << std::endl;
}

int main() {
    TextBlock tb("Hello Effective C++");
    printText(tb);
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <string>

int main() {
    // コンパイルが通れば、printText が定数参照を受け取っているため、ほぼ合格です
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `std::string getText()` の後ろに `const` を付けます（例：`std::string getText() const { ... }`）。 2. これにより、読み取り専用のコンテキストでもこのメンバ関数を呼び出せるようになります。",
    solution: `class TextBlock {
public:
    TextBlock(std::string text) : text(text) {}
    
    std::string getText() const {
        return text;
    }

private:
    std::string text;
};`,
    clientValidation: (code: string) => {
      const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
      if (!cleanCode.match(/std::string\s+getText\(\)\s+const/)) {
        return "テスト失敗: getText() メソッドは const メンバ関数として宣言される必要があります。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-04",
    category: "Effective C++",
    title: "6. Effective C++ 項04 (Item 04)",
    description: "項04: オブジェクトは使用前に初期化されるようにしてください。コンストラクタ本体での代入よりも、初期化リスト (member initialization lists) を使用する方が効率的であり、const や参照型のメンバを扱う際にも必要です。",
    task: "`PhoneNumber` のコンストラクタを、中括弧内での代入ではなくメンバ初期化リストを使用するようにリファクタリングしてください。",
    initialCode: `#include <iostream>
#include <string>

class PhoneNumber {
public:
    // --- TODO: ここで初期化リストを使用してください ---
    PhoneNumber(const std::string& areaCode, const std::string& number) {
        this->areaCode = areaCode;
        this->number = number;
    }

    void print() const {
        std::cout << "(" << areaCode << ") " << number << std::endl;
    }

private:
    std::string areaCode;
    std::string number;
};

int main() {
    PhoneNumber p("03", "1234-5678");
    p.print();
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. コンストラクタの引数リストの後に `:` を置きます。 2. `areaCode(areaCode), number(number)` のようにメンバを初期化します。 3. コンストラクタ本体 `{}` の中身は空にします。",
    solution: `class PhoneNumber {
public:
    PhoneNumber(const std::string& areaCode, const std::string& number) 
        : areaCode(areaCode), number(number) 
    {}

    void print() const {
        std::cout << "(" << areaCode << ") " << number << std::endl;
    }

private:
    std::string areaCode;
    std::string number;
};`,
    clientValidation: (code: string) => {
      const constructorMatch = code.match(/PhoneNumber\([^)]*\)\s*(:[^{]*)?\{([\s\S]*?)\}/);
      if (constructorMatch) {
          const initList = constructorMatch[1] || "";
          const body = constructorMatch[2];
          if (!initList.includes("areaCode") || !initList.includes("number")) {
              return "テスト失敗: メンバ初期化リストを使用する必要があります (例: : areaCode(areaCode), number(number))。";
          }
          if (body.includes("this->areaCode =") || body.includes("areaCode =")) {
              return "テスト失敗: コンストラクタ本体で値を代入してはいけません。初期化リストを使用してください。";
          }
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-05",
    category: "Effective C++",
    title: "7. Effective C++ 項05 (Item 05)",
    description: "項05: C++が背後で密かに作成・呼び出しを行う関数を把握しておきましょう。ユーザーが宣言しない場合、C++はデフォルトコンストラクタ、コピーコンストラクタ、コピー代入演算子、デストラクタを自動生成します。",
    task: "クラスが const や参照メンバを持つ場合、コンパイラはコピー代入演算子の自動生成に苦労します。現在のコードで `p2 = p1` を割り当てようとすると、コンパイルに失敗することに注目してください。あなたの課題は、コピー代入演算子を手動で実装することです（またはその難しさを理解することです）。この演習では、メンバを適切に処理する基本的なコピー代入演算子を実装してください。",
    initialCode: `#include <iostream>
#include <string>

class NamedPtr {
public:
    NamedPtr(std::string& name, int* ptr) : nameValue(name), ptrValue(ptr) {}
    
    // --- TODO: 手動で実装した operator= を追加してください ---
    // 実際には、項05にあるように、クラスに参照や const メンバがある場合、
    // コンパイラは自動的にコピー代入演算子を生成しません。

private:
    std::string& nameValue;
    int* ptrValue;
};

int main() {
    std::string name1 = "A";
    std::string name2 = "B";
    int val1 = 10;
    int val2 = 20;
    NamedPtr p1(name1, &val1);
    NamedPtr p2(name2, &val2);
    // p2 = p1; // 手動の operator= がないと、コンパイルに失敗します
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `NamedPtr& operator=(const NamedPtr& rhs) { ... }` を実装します。 2. 参照メンバ `nameValue` は再代入できないため、参照先の値を書き換えるか、あるいはこの設計自体に問題があることを認識するのが重要です。この演習では、値をコピーする実装を試みてください。",
    solution: `class NamedPtr {
public:
    NamedPtr(std::string& name, int* ptr) : nameValue(name), ptrValue(ptr) {}
    
    NamedPtr& operator=(const NamedPtr& rhs) {
        if (this == &rhs) return *this;
        nameValue = rhs.nameValue;
        *ptrValue = *rhs.ptrValue;
        return *this;
    }

private:
    std::string& nameValue;
    int* ptrValue;
};`,
    clientValidation: (code: string) => {
      if (!code.includes("operator=")) {
        return "テスト失敗: 手動でコピー代入演算子 `operator=` を実装する必要があります。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-06",
    category: "Effective C++",
    title: "8. Effective C++ 項06 (Item 06)",
    description: "項06: コンパイラが自動生成する関数の中で、望まないものは明示的に使用を禁止してください。モダンC++では、`= delete` を使用します。",
    task: "`HomeStore` クラスのコピーコンストラクタとコピー代入演算子に対して `= delete` を使用し、コピーや代入を禁止してください。",
    initialCode: `#include <iostream>

class HomeStore {
public:
    HomeStore() {}
    
    // --- TODO: アイテムのコピーを禁止してください ---
};

int main() {
    HomeStore h1;
    // HomeStore h2(h1); // これは禁止されている必要があります
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <type_traits>

int main() {
    if (std::is_copy_constructible<HomeStore>::value || std::is_copy_assignable<HomeStore>::value) {
        std::cout << "TEST_FAILED: HomeStore がまだコピー可能、または代入可能です。" << std::endl;
        return 1;
    }
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `HomeStore(const HomeStore&) = delete;` と書き、コピーコンストラクタを禁止します。 2. `HomeStore& operator=(const HomeStore&) = delete;` と書き、代入演算子を禁止します。",
    solution: `class HomeStore {
public:
    HomeStore() {}
    
    HomeStore(const HomeStore&) = delete;
    HomeStore& operator=(const HomeStore&) = delete;
};`,
    clientValidation: (code: string) => {
      const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
      if (!cleanCode.includes("= delete")) {
        return "テスト失敗: コピーコンストラクタと代入演算子を禁止するには `= delete` を使用してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-07",
    category: "Effective C++",
    title: "9. Effective C++ 項07 (Item 07)",
    description: "項07: ポリモーフィックな基底クラスではデストラクタを virtual と宣言してください。クラスが virtual 関数を持っているなら、派生クラスのオブジェクトが正しく破棄されるように、ほぼ間違いなく virtual デストラクタを持つべきです。",
    task: "`Base` クラスのデストラクタを `virtual` にしてください。これにより、`Base*` を通じて `Derived` オブジェクトを削除する際のメモリリーク（または未定義の動作）が修正されます。",
    initialCode: `#include <iostream>

class Base {
public:
    Base() { std::cout << "Base constructed" << std::endl; }
    
    // --- TODO: このデストラクタを virtual にしてください ---
    ~Base() { std::cout << "Base destroyed" << std::endl; }
};

class Derived : public Base {
public:
    Derived() { std::cout << "Derived constructed" << std::endl; }
    ~Derived() { std::cout << "Derived destroyed" << std::endl; }
};

int main() {
    Base* b = new Derived();
    delete b;
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <string>
#include <sstream>

int main() {
    std::stringstream buffer;
    std::streambuf* old = std::cout.rdbuf(buffer.rdbuf());
    
    Base* b = new Derived();
    delete b;
    
    std::cout.rdbuf(old);
    std::string output = buffer.str();
    
    if (output.find("Derived destroyed") != std::string::npos) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    } else {
        std::cout << "TEST_FAILED: Derived のデストラクタが呼び出されませんでした！" << std::endl;
        return 1;
    }
}
`,
    hint: "1. `Base` クラスのデストラクタに `virtual` を付けます。 2. これにより、派生クラスのインスタンスを基底クラスのポインタで `delete` した際、派生クラスのデストラクタも呼ばれるようになります。",
    solution: `class Base {
public:
    Base() { std::cout << "Base constructed" << std::endl; }
    virtual ~Base() { std::cout << "Base destroyed" << std::endl; }
};

class Derived : public Base {
public:
    Derived() { std::cout << "Derived constructed" << std::endl; }
    ~Derived() { std::cout << "Derived destroyed" << std::endl; }
};`,
    clientValidation: (code: string) => {
      const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
      if (!cleanCode.toLowerCase().includes("virtual ~base")) {
        return "テスト失敗: Base クラスのデストラクタを `virtual` と宣言してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-09",
    category: "Effective C++",
    title: "10. Effective C++ 項09 (Item 09)",
    description: "項09: コンストラクタやデストラクタ内では決して virtual 関数を呼び出さないでください。そのような呼び出しは派生クラスへは行われません。なぜなら、基底クラスの構築中、そのオブジェクトはまだ基底クラスのオブジェクトだからです。",
    task: "`Transaction` のコンストラクタから、virtual 関数 `logTransaction` の呼び出しを削除してください。代わりに、必要な情報をコンストラクタのパラメータとして渡すようにします。",
    initialCode: `#include <iostream>
#include <string>

class Transaction {
public:
    Transaction() {
        // --- TODO: この呼び出しをコンストラクタの外に移動してください ---
        logTransaction(); 
    }
    virtual void logTransaction() const = 0;
};

class BuyTransaction : public Transaction {
public:
    virtual void logTransaction() const override {
        std::cout << "Buy Transaction" << std::endl;
    }
};

int main() {
    BuyTransaction b;
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    // コンストラクタでの純粋仮想関数の呼び出しは通常、クラッシュやリンカエラーを引き起こします。
    // コンパイルが通り、クラッシュしなければ一歩前進です。
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. コンストラクタ内での仮想関数呼び出しは、実行時には基底クラスの関数が呼ばれてしまいます。 2. 代わりに、ログに必要な情報を引数などで渡す設計にします。 3. この問題では、単にコンストラクタ内の呼び出しをコメントアウトするか、設計を見直す手法を考えます。",
    solution: `class Transaction {
public:
    Transaction() {
        // logTransaction(); // これを削除します
    }
    virtual void logTransaction() const = 0;
};

class BuyTransaction : public Transaction {
public:
    BuyTransaction() {
        logTransaction(); // 必要なら派生クラスのコンストラクタで呼びます
    }
    virtual void logTransaction() const override {
        std::cout << "Buy Transaction" << std::endl;
    }
};`,
    clientValidation: (code: string) => {
      const constructorMatch = code.match(/Transaction\(\)[^{]*\{([\s\S]*?)\}/);
      if (constructorMatch && constructorMatch[1].includes("logTransaction()")) {
        return "テスト失敗: コンストラクタ内で virtual 関数を呼び出さないでください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-10",
    category: "Effective C++",
    title: "11. Effective C++ 項10 (Item 10)",
    description: "項10: 代入演算子は `*this` への参照を返すようにしてください。これは、代入の「連鎖」(例: x = y = z = 15) を可能にするために、すべての組み込み型が従っている慣習です。",
    task: "`operator=` の戻り値の型と値を、`*this` への参照を返す慣習に従うように更新してください。",
    initialCode: `#include <iostream>

class Widget {
public:
    Widget(int v) : val(v) {}
    
    // --- TODO: 戻り値の型と戻り値をリファクタリングしてください ---
    void operator=(const Widget& rhs) {
        val = rhs.val;
    }

    int getVal() const { return val; }

private:
    int val;
};

int main() {
    Widget w1(10), w2(20), w3(30);
    w1 = w2;
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    Widget w1(10), w2(20), w3(30);
    w1 = w2 = w3; // これで動作するはずです
    if (w1.getVal() == 30) {
        std::cout << "TEST_PASSED" << std::endl;
    } else {
        std::cout << "TEST_FAILED: 代入の連鎖が正しく動作しませんでした。" << std::endl;
    }
    return 0;
}
`,
    hint: "1. 戻り値の型を `void` から `Widget&` に変更します。 2. 関数本体の最後で `return *this;` を追加します。",
    solution: `class Widget {
public:
    Widget(int v) : val(v) {}
    
    Widget& operator=(const Widget& rhs) {
        val = rhs.val;
        return *this;
    }

    int getVal() const { return val; }

private:
    int val;
};`,
    clientValidation: (code: string) => {
      const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
      if (!cleanCode.includes("Widget& operator=") || !cleanCode.includes("return *this")) {
        return "テスト失敗: operator= は `Widget&` を返し、`return *this;` する必要があります。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-11",
    category: "Effective C++",
    title: "12. Effective C++ 項11 (Item 11)",
    description: "項11: `operator=` での自己代入 (self-assignment) を処理してください。これは、`rhs` と `*this` が同じオブジェクトである場合に、コピーされる前にメモリが削除されてしまうバグを防ぎます。",
    task: "`Bitmap` クラスの `operator=` に「自己代入ガード」を追加してください。",
    initialCode: `#include <iostream>

class Bitmap {};
class Widget {
public:
    Widget() : pb(new Bitmap()) {}
    ~Widget() { delete pb; }

    Widget& operator=(const Widget& rhs) {
        // --- TODO: 自己代入チェックを追加してください ---
        delete pb;
        pb = new Bitmap(*rhs.pb);
        return *this;
    }

private:
    Bitmap* pb;
};

int main() {
    Widget w1;
    w1 = w1; // 自己代入
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. 関数の冒頭で `if (this == &rhs) return *this;` と記述します。 2. これにより、自分自身を代入しようとした場合に、誤ってリソースを破棄してしまうのを防げます。",
    solution: `Widget& operator=(const Widget& rhs) {
    if (this == &rhs) return *this; // 自己代入ガード
    
    delete pb;
    pb = new Bitmap(*rhs.pb);
    return *this;
}`,
    clientValidation: (code: string) => {
      const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
      if (!cleanCode.includes("if (this == &rhs)") && !cleanCode.includes("if(this==&rhs)")) {
        return "テスト失敗: 既存のリソースを削除する前に、自己代入をチェックする必要があります (例: `if (this == &rhs) return *this;`)。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-12",
    category: "Effective C++",
    title: "13. Effective C++ 項12 (Item 12)",
    description: "項12: オブジェクトのあらゆる部分をコピーしてください。コピー関数（コピーコンストラクタとコピー代入演算子）を実装する際は、すべてのデータメンバをコピーし、基底クラスのコピー関数も呼び出すようにしてください。",
    task: "`PriorityCustomer` のコピーコンストラクタを更新して、基底クラス `Customer` のコピーコンストラクタを正しく呼び出すようにしてください。",
    initialCode: `#include <iostream>
#include <string>

class Customer {
public:
    Customer(const std::string& name) : name(name) {}
    Customer(const Customer& rhs) : name(rhs.name) {
        std::cout << "Customer copy ctor" << std::endl;
    }
private:
    std::string name;
};

class PriorityCustomer : public Customer {
public:
    PriorityCustomer(const std::string& name, int p) : Customer(name), priority(p) {}
    
    // --- TODO: このコピーコンストラクタを修正してください ---
    PriorityCustomer(const PriorityCustomer& rhs) : priority(rhs.priority) {
        std::cout << "PriorityCustomer copy ctor" << std::endl;
    }

private:
    int priority;
};

int main() {
    PriorityCustomer c1("Isaac", 10);
    PriorityCustomer c2(c1);
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <string>
#include <sstream>

int main() {
    std::stringstream buffer;
    std::streambuf* old = std::cout.rdbuf(buffer.rdbuf());
    
    PriorityCustomer c1("Isaac", 10);
    PriorityCustomer c2(c1);
    
    std::cout.rdbuf(old);
    std::string output = buffer.str();
    
    if (output.find("Customer copy ctor") != std::string::npos) {
        std::cout << "TEST_PASSED" << std::endl;
    } else {
        std::cout << "TEST_FAILED: 基底クラス Customer の部分が正しくコピーされませんでした！" << std::endl;
    }
    return 0;
}
`,
    hint: "1. `PriorityCustomer` のコピーコンストラクタの初期化リストで、`Customer(rhs)` を呼び出します。 2. これにより、基底クラスのメンバ（nameなど）が正しくコピーされます。",
    solution: `PriorityCustomer(const PriorityCustomer& rhs) 
    : Customer(rhs), priority(rhs.priority) {
    std::cout << "PriorityCustomer copy ctor" << std::endl;
}`,
    clientValidation: (code: string) => {
      const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
      if (!cleanCode.match(/PriorityCustomer\s*\(\s*const\s+PriorityCustomer\s*&\s*rhs\s*\)\s*:\s*Customer\s*\(\s*rhs\s*\)/)) {
        return "テスト失敗: 初期化リストで基底クラスのコピーコンストラクタを呼び出すのを忘れています。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-13",
    category: "Effective C++",
    title: "14. Effective C++ 項13 (Item 13)",
    description: "項13: リソース管理にはオブジェクトを使用してください (RAII)。`std::unique_ptr` や `std::shared_ptr` などのスマートポインタを使用することで、生 (raw) の `new` や `delete` を避けてください。",
    task: "`process` 関数をリファクタリングして、生ポインタの代わりに `std::unique_ptr<Investment>` を使用するようにしてください。これにより、例外が発生しても投資リソースが常に解放されるようになります。",
    initialCode: `#include <iostream>
#include <memory>

class Investment {
public:
    Investment() { std::cout << "Investment acquired" << std::endl; }
    ~Investment() { std::cout << "Investment released" << std::endl; }
};

void process() {
    // --- TODO: 生ポインタの代わりに std::unique_ptr を使用してください ---
    Investment* pInv = new Investment();
    
    // ... 例外をスローしたり、早期に return する可能性のあるロジック ...
    
    delete pInv;
}

int main() {
    process();
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <string>
#include <sstream>

int main() {
    std::stringstream buffer;
    std::streambuf* old = std::cout.rdbuf(buffer.rdbuf());
    
    process();
    
    std::cout.rdbuf(old);
    std::string output = buffer.str();
    
    if (output.find("Investment released") != std::string::npos) {
        std::cout << "TEST_PASSED" << std::endl;
    } else {
        std::cout << "TEST_FAILED: 投資リソースが解放されませんでした！" << std::endl;
    }
    return 0;
}
`,
    hint: "1. `Investment* pInv = new Investment();` を `std::unique_ptr<Investment> pInv(new Investment());` または `auto pInv = std::make_unique<Investment>();` に書き換えます。 2. `delete pInv;` を削除します。",
    solution: `void process() {
    std::unique_ptr<Investment> pInv(new Investment());
    // ... 例外が発生しても pInv のデストラクタがリソースを解放します ...
}`,
    clientValidation: (code: string) => {
      if (!code.includes("std::unique_ptr") && !code.includes("std::shared_ptr")) {
        return "テスト失敗: 投資リソースを管理するためにスマートポインタ (std::unique_ptr または std::shared_ptr) を使用してください。";
      }
      if (code.includes("delete pInv")) {
        return "テスト失敗: 手動の `delete` 呼び出しを削除する必要があります。スマートポインタが自動的に処理します。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-14",
    category: "Effective C++",
    title: "15. Effective C++ 項14 (Item 14)",
    description: "項14: リソース管理クラスでのコピー動作を慎重に考えてください。選択肢には、コピーの禁止、リソースの参照カウント、基礎となるリソースのコピー（ディープコピー）、または所有権の移転があります。",
    task: "コピー関数を削除（項06のスタイル）することで、`Lock` クラスのコピーを禁止してください。これは、ミューテックスロックのような排他的なリソース管理でよく行われます。",
    initialCode: `#include <iostream>

class Mutex {};
void lock(Mutex* pm) { std::cout << "Locked" << std::endl; }
void unlock(Mutex* pm) { std::cout << "Unlocked" << std::endl; }

class Lock {
public:
    explicit Lock(Mutex* pm) : mutexPtr(pm) { lock(mutexPtr); }
    ~Lock() { unlock(mutexPtr); }
    
    // --- TODO: コピーを禁止してください ---

private:
    Mutex *mutexPtr;
};

int main() {
    Mutex m;
    Lock ml1(&m);
    // Lock ml2(ml1); // これは失敗する必要があります
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <type_traits>

int main() {
    if (std::is_copy_constructible<Lock>::value || std::is_copy_assignable<Lock>::value) {
        std::cout << "TEST_FAILED: Lock はコピー可能であってはいけません。" << std::endl;
        return 1;
    }
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. コピーコンストラクタとコピー代入演算子を `= delete` で宣言します。 2. これにより、オブジェクトのコピーがコンパイル時に禁止されます。",
    solution: `class Lock {
public:
    explicit Lock(Mutex* pm) : mutexPtr(pm) { lock(mutexPtr); }
    ~Lock() { unlock(mutexPtr); }
    
    // コピーを禁止
    Lock(const Lock&) = delete;
    Lock& operator=(const Lock&) = delete;

private:
    Mutex *mutexPtr;
};`,
    clientValidation: (code: string) => {
      if (!code.includes("= delete")) {
        return "テスト失敗: Lock クラスのコピーを禁止するには `= delete` を使用してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-15",
    category: "Effective C++",
    title: "16. Effective C++ 項15 (Item 15)",
    description: "項15: リソース管理クラスでは、生 (raw) のリソースへのアクセスを可能にしてください。APIは生ポインタを要求することが多いため、RAIIクラスは基盤となるリソースにアクセスする方法（`get()` メソッドや暗黙の変換など）を提供すべきです。",
    task: "`Font` クラスに、生の `FontHandle` を返す `get()` メソッドを追加してください。",
    initialCode: `#include <iostream>

typedef void* FontHandle;
FontHandle getFont() { return (FontHandle)1234; }
void releaseFont(FontHandle fh) {}

class Font {
public:
    explicit Font(FontHandle fh) : f(fh) {}
    ~Font() { releaseFont(f); }

    // --- TODO: FontHandle を返す get() メソッドを追加してください ---

private:
    FontHandle f;
};

int main() {
    Font f(getFont());
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    Font f(getFont());
    FontHandle fh = f.get();
    if (fh == (FontHandle)1234) {
        std::cout << "TEST_PASSED" << std::endl;
    } else {
        std::cout << "TEST_FAILED: get() が間違ったハンドルを返しました。" << std::endl;
    }
    return 0;
}
`,
    hint: "1. クラス内に `FontHandle get() const { return f; }` メソッドを追加します。 2. これにより、RAIIクラスから生のハンドルを取得できるようになります。",
    solution: `class Font {
public:
    explicit Font(FontHandle fh) : f(fh) {}
    ~Font() { releaseFont(f); }

    FontHandle get() const { return f; }

private:
    FontHandle f;
};`,
    clientValidation: (code: string) => {
      if (!code.includes("FontHandle get()")) {
        return "テスト失敗: `FontHandle` を返す `get()` メソッドが必要です。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-16",
    category: "Effective C++",
    title: "17. Effective C++ 項16 (Item 16)",
    description: "項16: new と delete の対応する形式を同じにしてください。`new` を使用した場合は `delete` を、`new[]` を使用した場合は `delete[]` を使用してください。",
    task: "`cleanup` 関数内でのメモリ削除を修正し、`new[]` で割り当てられた配列に対して正しく `delete[]` を使用するようにしてください。",
    initialCode: `#include <iostream>
#include <string>

void cleanup() {
    std::string* stringArray = new std::string[10];
    
    // --- TODO: この削除処理を修正してください ---
    delete stringArray; 
}

int main() {
    cleanup();
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    // これをランタイムでテストするのは難しい（未定義の動作）ため、
    // ソースコードの検証に依存します。
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `delete stringArray;` を `delete[] stringArray;` に修正します。 2. 配列形式の `new` には配列形式の `delete` を使う必要があります。",
    solution: `void cleanup() {
    std::string* stringArray = new std::string[10];
    delete[] stringArray; 
}`,
    clientValidation: (code: string) => {
      if (code.includes("delete stringArray") && !code.includes("delete[] stringArray")) {
        return "テスト失敗: `new[]` を使用したため、`delete[]` を使用する必要があります。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-17",
    category: "Effective C++",
    title: "18. Effective C++ 項17 (Item 17)",
    description: "項17: new で作成したオブジェクトは、独立したステートメントでスマートポインタに格納してください。これにより、`new` とスマートポインタのコンストラクタの間（例: 関数の引数内）で例外が発生した場合のリソースリークを防げます。",
    task: "`processWidget` の呼び出しをリファクタリングして、関数に渡す前に、独立したステートメントで `std::shared_ptr<Widget>` を作成するようにしてください。",
    initialCode: `#include <iostream>
#include <memory>

class Widget {};
int priority() { return 1; }
void processWidget(std::shared_ptr<Widget> pw, int priority) {}

int main() {
    // --- TODO: これを2つのステートメントにリファクタリングしてください ---
    processWidget(std::shared_ptr<Widget>(new Widget), priority());
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `std::shared_ptr<Widget> pw(new Widget);` を独立したステートメントとして作成します。 2. その後で `processWidget(pw, priority());` を呼び出します。",
    solution: `int main() {
    std::shared_ptr<Widget> pw(new Widget);
    processWidget(pw, priority());
    return 0;
}`,
    clientValidation: (code: string) => {
      if (code.includes("processWidget(std::shared_ptr<Widget>(new Widget)")) {
        return "テスト失敗: 関数を呼び出す前に、独立したステートメントで shared_ptr を作成してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-21",
    category: "Effective C++",
    title: "19. Effective C++ 項21 (Item 21)",
    description: "項21: オブジェクトを返すべきところで参照を返そうとしないでください。ローカルオブジェクトへの参照を返すと、破棄されたメモリ（ゴミデータ）への参照になってしまいます。",
    task: "`operator*` の戻り値を修正して、ローカル変数への `const Rational&` ではなく、`Rational` オブジェクトを「値渡し」で返すようにしてください。",
    initialCode: `#include <iostream>

class Rational {
public:
    Rational(int n = 0, int d = 1) : n(n), d(d) {}
    int n, d;
};

// --- TODO: 戻り値の型を修正してください ---
const Rational& operator*(const Rational& lhs, const Rational& rhs) {
    Rational result(lhs.n * rhs.n, lhs.d * rhs.d);
    return result; // エラー: ローカルオブジェクトへの参照を返しています！
}

int main() {
    Rational r1(1, 2), r2(3, 4);
    Rational r3 = r1 * r2;
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. 関数の戻り値の型を `const Rational&` から `Rational` に変更します。 2. ローカル変数の参照を返してはいけません。",
    solution: `Rational operator*(const Rational& lhs, const Rational& rhs) {
    Rational result(lhs.n * rhs.n, lhs.d * rhs.d);
    return result; 
}`,
    clientValidation: (code: string) => {
      if (code.includes("const Rational& operator*")) {
        return "テスト失敗: operator* は Rational オブジェクトを値渡しで返す必要があります（参照ではなく）。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-22",
    category: "Effective C++",
    title: "20. Effective C++ 項22 (Item 22)",
    description: "項22: データメンバは private と宣言してください。これによりカプセル化が提供され、アクセス制御（読み取り専用、書き込み専用など）が可能になり、クライアントコードを壊さずに実装を変更できるようになります。",
    task: "`Speed` クラスをリファクタリングして、`value` データメンバを private にし、代わりに getter/setter メソッドを提供してください。",
    initialCode: `#include <iostream>

class Speed {
public:
    // --- TODO: これを private にし、getter/setter を追加してください ---
    double value;
};

int main() {
    Speed s;
    s.value = 100.0;
    std::cout << s.value << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    Speed s;
    s.setSpeed(50.5);
    if (s.getSpeed() == 50.5) {
        std::cout << "TEST_PASSED" << std::endl;
    } else {
        std::cout << "TEST_FAILED: getter/setter が正しく動作していません。" << std::endl;
    }
    return 0;
}
`,
    hint: "1. `value` を `private` セクションに移動します。 2. `double getSpeed() const` と `void setSpeed(double v)` メソッドを追加します。",
    solution: `class Speed {
public:
    double getSpeed() const { return value; }
    void setSpeed(double v) { value = v; }
private:
    double value;
};`,
    clientValidation: (code: string) => {
      if (code.includes("public:\n    double value") || code.includes("public:\n    double value;")) {
        return "テスト失敗: データメンバは `private` であるべきです。";
      }
      if (!code.includes("double getSpeed") || !code.includes("void setSpeed")) {
        return "テスト失敗: `getSpeed()` と `setSpeed(double)` メソッドを提供してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-23",
    category: "Effective C++",
    title: "21. Effective C++ 項23 (Item 23)",
    description: "項23: メンバ関数よりも、メンバでもメンバでもない非メンバ・非フレンド関数を優先してください。これにより、privateデータメンバにアクセスできる関数の数が減り、カプセル化のレベルが高まります。",
    task: "`clearEverything` をメンバ関数から、`WebBrowserUtils` 名前空間内の非メンバ関数にリファクタリングしてください。この関数は、既存のメンバ関数 `clearCache()` と `clearHistory()` を呼び出す必要があります。",
    initialCode: `#include <iostream>

class WebBrowser {
public:
    void clearCache() { std::cout << "Cache cleared" << std::endl; }
    void clearHistory() { std::cout << "History cleared" << std::endl; }
    
    // --- TODO: これをメンバではない関数に移動してください ---
    void clearEverything() {
        clearCache();
        clearHistory();
    }
};

int main() {
    WebBrowser wb;
    wb.clearEverything();
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    WebBrowser wb;
    clearEverything(wb); // 非メンバ関数の呼び出しをテスト
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `clearEverything` を `class WebBrowser` の外部に移動します。 2. 関数シグネチャを `void clearEverything(WebBrowser& wb)` とし、引数で受け取った `wb` のメンバ関数を呼び出します。",
    solution: `class WebBrowser {
public:
    void clearCache() { std::cout << "Cache cleared" << std::endl; }
    void clearHistory() { std::cout << "History cleared" << std::endl; }
};

void clearEverything(WebBrowser& wb) {
    wb.clearCache();
    wb.clearHistory();
}`,
    clientValidation: (code: string) => {
      if (code.includes("void clearEverything()") && code.includes("class WebBrowser {")) {
        const browserPart = code.substring(code.indexOf("class WebBrowser"), code.indexOf("};"));
        if (browserPart.includes("clearEverything")) {
            return "テスト失敗: clearEverything は WebBrowser のメンバではなく、非メンバ関数にする必要があります。";
        }
      }
      if (!code.includes("void clearEverything(WebBrowser")) {
          return "テスト失敗: clearEverything は引数として WebBrowser オブジェクトを受け取る必要があります。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-24",
    category: "Effective C++",
    title: "22. Effective C++ 項24 (Item 24)",
    description: "項24: すべてのパラメータに型変換を適用する必要がある場合は、非メンバ関数を宣言してください。演算子の左辺（例: `2 * rational`）に型変換が必要な場合は、非メンバ関数を使用します。",
    task: "`operator*` をメンバ関数から非メンバ関数にリファクタリングし、`2.0 * result` のような式が正しく動作するようにしてください。",
    initialCode: `#include <iostream>

class Rational {
public:
    Rational(double d = 0) : val(d) {}
    
    // --- TODO: これをメンバではない関数に移動してください ---
    const Rational operator*(const Rational& rhs) const {
        return Rational(this->val * rhs.val);
    }
    
    double val;
};

int main() {
    Rational r(0.5);
    Rational result = r * 2.0; // メンバ関数として動作する (2.0 が Rational に変換される)
    // Rational result2 = 2.0 * r; // メンバ関数としては失敗する
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    Rational r(0.5);
    Rational res1 = r * 2.0;
    Rational res2 = 2.0 * r; // 対称的な変換をテスト
    if (res1.val == 1.0 && res2.val == 1.0) {
        std::cout << "TEST_PASSED" << std::endl;
    } else {
        std::cout << "TEST_FAILED: 型変換が対称的に動作しませんでした。" << std::endl;
    }
    return 0;
}
`,
    hint: "非メンバ関数として operator* を実装することで、左辺が Rational ではない場合（例：double * Rational）でもコンストラクタによる暗黙の型変換が適用されるようになります。クラス内で friend 宣言することも検討してください。",
    solution: `class Rational {
public:
    Rational(double d = 0) : val(d) {}
    // friend 宣言（オプション）
    friend const Rational operator*(const Rational& lhs, const Rational& rhs);
    double val;
};

// 非メンバ関数として定義
const Rational operator*(const Rational& lhs, const Rational& rhs) {
    return Rational(lhs.val * rhs.val);
}`,
    clientValidation: (code: string) => {
      // Find the class definition block
      const classStart = code.indexOf("class Rational");
      const classEnd = code.indexOf("};", classStart);
      
      if (classStart !== -1 && classEnd !== -1) {
          const classBody = code.substring(classStart, classEnd);
          // friend 宣言は許容するが、純粋なメンバ関数としての operator* は禁止する
          // 「operator*」が含まれていても、その直前に「friend」があればOKとする
          const lines = classBody.split('\n');
          for (const line of lines) {
              if (line.includes("operator*") && !line.includes("friend")) {
                  return "テスト失敗: operator* はクラスのメンバ関数ではなく、非メンバ関数として定義してください（暗黙の型変換を両方の引数に適用するため）。";
              }
          }
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-01",
    category: "Effective C++",
    title: "23. Effective C++ 項01 (Item 01)",
    description: "項01: C++を言語連盟 (a federation of languages: C, オブジェクト指向 C++, テンプレート C++, STL) と見なしてください。使用しているサブ言語によって、最適な経験則が変わる場合があります（例: C形式の型は値渡し、オブジェクトは定数参照渡し）。",
    task: "`processInt` 関数 (C形式) は `int` を値渡しで受け取り、`processString` 関数 (テンプレート/STL形式) は `std::string` を定数参照渡しで受け取るようにリファクタリングしてください。",
    initialCode: `#include <iostream>
#include <string>

// --- TODO: パラメータの型を修正してください ---
void processInt(const int& i) { 
    std::cout << i << std::endl;
}

void processString(std::string s) {
    std::cout << s << std::endl;
}

int main() {
    processInt(10);
    processString("Hello");
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `processInt` の引数を `int i` に変更します。 2. `processString` の引数を `const std::string& s` に変更します。",
    solution: `void processInt(int i) { 
    std::cout << i << std::endl;
}

void processString(const std::string& s) {
    std::cout << s << std::endl;
}`,
    clientValidation: (code: string) => {
      if (code.includes("processInt(const int&")) {
          return "テスト失敗: `int` のような単純な組み込み型 (C形式のC++) では、参照渡しよりも値渡しの方が効率的であることが多いです。";
      }
      if (code.includes("processString(std::string s)")) {
          return "テスト失敗: `std::string` のようなオブジェクト (STL/オブジェクト指向C++) では、定数参照渡しが好まれます。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-08",
    category: "Effective C++",
    title: "24. Effective C++ 項08 (Item 08)",
    description: "項08: デストラクタから例外が漏れ出さないようにしてください。デストラクタから例外がスローされると、スタックの巻き戻し中に未定義の動作やプログラムの強制終了を引き起こす可能性があります。",
    task: "`DBConn` のデストラクタ内での `db.close()` 中にスローされる可能性のある例外を捕捉し、適切に処理（破棄またはログ出力）して、デストラクタの外に漏れないようにしてください。",
    initialCode: `#include <iostream>
#include <exception>

class DBConnection {
public:
    void close() { throw std::exception(); } // 失敗をシミュレート
};

class DBConn {
public:
    DBConn(DBConnection& db) : db(db) {}
    
    // --- TODO: 例外が漏れないようにしてください ---
    ~DBConn() {
        db.close();
    }
private:
    DBConnection& db;
};

int main() {
    DBConnection db;
    {
        DBConn dc(db);
    } // ここでデストラクタが呼び出されます
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    // デストラクタ内での未処理の例外によってメインプロセスがクラッシュしなければ合格です。
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `~DBConn` の中で `try { db.close(); } catch (...) { /* 処理 */ }` と記述し、例外が外に漏れないようにします。",
    solution: `~DBConn() {
    try {
        db.close();
    } catch (...) {
        // 例外を飲み込むか、ログを出すか、プログラムを終了させます
        std::cerr << "Exception in destructor" << std::endl;
    }
}`,
    clientValidation: (code: string) => {
      if (!code.includes("try") || !code.includes("catch")) {
          return "テスト失敗: 例外が漏れ出すのを防ぐため、デストラクタ内で try-catch ブロックを使用してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-25",
    category: "Effective C++",
    title: "25. Effective C++ 項25 (Item 25)",
    description: "項25: 例外を投げない swap のサポートを検討してください。`pimpl` パターンなどを使用している場合、標準の `std::swap` は効率が悪いため、メンバ関数としての `swap` と、それを呼び出す非メンバの `swap` を提供するのが一般的です。",
    task: "`Widget` クラスに `swap` メンバ関数を実装し、それを利用する非メンバの `swap` 関数を `Widget` と同じ名前空間（ここではグローバル）に定義してください。",
    initialCode: `#include <iostream>
#include <vector>
#include <algorithm>

class WidgetImpl {
public:
    std::vector<double> v; // 巨大なデータ
};

class Widget {
public:
    Widget() : pImpl(new WidgetImpl()) {}
    ~Widget() { delete pImpl; }

    // --- TODO: swap メンバ関数を実装してください ---

private:
    WidgetImpl* pImpl;
};

// --- TODO: 非メンバの swap 関数を実装してください ---

int main() {
    Widget w1, w2;
    // swap(w1, w2);
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    // 構造のチェックに依存します
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `Widget` クラス内に `void swap(Widget& other)` を作り、その中で `using std::swap; swap(pImpl, other.pImpl);` を行います。 2. クラス外に `void swap(Widget& a, Widget& b) { a.swap(b); }` を定義します。",
    solution: `class Widget {
public:
    void swap(Widget& other) {
        using std::swap;
        swap(pImpl, other.pImpl);
    }
    // ...
};

void swap(Widget& a, Widget& b) {
    a.swap(b);
}`,
    clientValidation: (code: string) => {
      if (!code.includes("void swap(Widget&")) {
          return "テスト失敗: Widget クラス内に `void swap(Widget& other)` メンバ関数を実装してください。";
      }
      if (!code.match(/void\s+swap\s*\(\s*Widget\s*&\s*\w+\s*,\s*Widget\s*&\s*\w+\s*\)/)) {
          return "テスト失敗: メンバ関数を呼び出す非メンバの `swap(Widget& a, Widget& b)` 関数を定義してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-26",
    category: "Effective C++",
    title: "26. Effective C++ 項26 (Item 26)",
    description: "項26: 変数の定義は可能な限り遅らせてください。変数が使用される前に例外が発生したり、早期リターンしたりする場合、その変数の構築と解体のコストが無駄になります。",
    task: "`encryptPassword` 関数をリファクタリングして、変数の定義を使用される直前まで移動させてください。",
    initialCode: `#include <iostream>
#include <string>
#include <stdexcept>

std::string encrypt(const std::string& password) { return password; }

void processPassword(const std::string& password) {
    // --- TODO: これらの定義を使用される場所まで移動してください ---
    std::string encrypted;
    
    if (password.length() < 5) {
        throw std::runtime_error("Password too short");
    }
    
    // ここで初めて encrypted が必要になります
    encrypted = encrypt(password);
    std::cout << "Encrypted: " << encrypted << std::endl;
}

int main() {
    try { processPassword("123"); } catch(...) {}
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `std::string encrypted;` の定義を `if (password.length() < 5)` のチェックの後まで移動します。 2. これにより、例外が投げられた場合に無駄な構築・解体を避けることができます。",
    solution: `void processPassword(const std::string& password) {
    if (password.length() < 5) {
        throw std::runtime_error("Password too short");
    }
    
    std::string encrypted = encrypt(password);
    std::cout << "Encrypted: " << encrypted << std::endl;
}`,
    clientValidation: (code: string) => {
      const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
      const lines = cleanCode.split('\n');
      let foundDefinition = false;
      let foundLengthCheck = false;
      for (const line of lines) {
          if (line.includes("std::string encrypted")) foundDefinition = true;
          if (line.includes("password.length() < 5")) foundLengthCheck = true;
          
          if (foundDefinition && !foundLengthCheck) {
              return "テスト失敗: `encrypted` の定義は長さチェックの後に行うべきです。";
          }
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-27",
    category: "Effective C++",
    title: "27. Effective C++ 項27 (Item 27)",
    description: "項27: キャストを最小限にしてください。特に C 形式のキャストは避け、意味が明確な C++ 形式のキャスト (`static_cast`, `const_cast`, `dynamic_cast`, `reinterpret_cast`) を使用してください。",
    task: "C 形式のキャストを適切な C++ 形式のキャストに書き換えてください。",
    initialCode: `#include <iostream>

class Widget {
public:
    virtual void func() {}
};

class SpecialWidget : public Widget {
public:
    void special() { std::cout << "Special!" << std::endl; }
};

void doSomething(Widget* pw) {
    // --- TODO: C 形式のキャストを C++ 形式に書き換えてください ---
    SpecialWidget* psw = (SpecialWidget*)pw;
    if (psw) psw->special();
}

int main() {
    SpecialWidget sw;
    doSomething(&sw);
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `(SpecialWidget*)pw` を `static_cast<SpecialWidget*>(pw)` または `dynamic_cast<SpecialWidget*>(pw)` に変更します。 2. C++形式のキャストを使用しましょう。",
    solution: `void doSomething(Widget* pw) {
    SpecialWidget* psw = dynamic_cast<SpecialWidget*>(pw);
    if (psw) psw->special();
}`,
    clientValidation: (code: string) => {
      if (code.includes("(SpecialWidget*)pw")) {
          return "テスト失敗: C 形式のキャスト `(SpecialWidget*)` は使用しないでください。";
      }
      if (!code.includes("static_cast") && !code.includes("dynamic_cast")) {
          return "テスト失敗: `static_cast` または `dynamic_cast` を使用してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-28",
    category: "Effective C++",
    title: "28. Effective C++ 項28 (Item 28)",
    description: "項28: オブジェクトの内部データへの「ハンドル」（リファレンス、ポインタ、イテレータ）を返さないようにしてください。これにより、カプセル化が保たれ、オブジェクトが破棄された後の「ダングリングハンドル」を防ぐことができます。",
    task: "`Rectangle` クラスのメンバ関数を修正して、内部の `Point` オブジェクトへの参照を直接返すのではなく、定数参照を返すか、値を返すようにしてください。",
    initialCode: `#include <iostream>

struct Point {
    int x, y;
    Point(int x=0, int y=0) : x(x), y(y) {}
};

class Rectangle {
public:
    Rectangle(Point p1, Point p2) : pTopLeft(p1), pBottomRight(p2) {}
    
    // --- TODO: 内部データへの直接の変更を許さないように修正してください ---
    Point& upperLeft() { return pTopLeft; }
    Point& lowerRight() { return pBottomRight; }

private:
    Point pTopLeft;
    Point pBottomRight;
};

int main() {
    Point p1(0, 10), p2(10, 0);
    Rectangle rect(p1, p2);
    rect.upperLeft().x = 50; // 内部データが外部から直接変更できてしまう
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <type_traits>

int main() {
    // 戻り値の型をチェック（ここでは簡易的に）
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. メソッドの戻り値を `Point&` から `const Point&` に変更します。 2. これにより、外部から内部データを直接書き換えられるのを防ぎます。",
    solution: `class Rectangle {
public:
    Rectangle(Point p1, Point p2) : pTopLeft(p1), pBottomRight(p2) {}
    
    const Point& upperLeft() const { return pTopLeft; }
    const Point& lowerRight() const { return pBottomRight; }

private:
    Point pTopLeft;
    Point pBottomRight;
};`,
    clientValidation: (code: string) => {
      if (code.includes("Point& upperLeft()") || code.includes("Point& lowerRight()")) {
          return "テスト失敗: 内部データへの参照 `Point&` を直接返すと、カプセル化が破壊されます。`const Point&` を使いましょう。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-29",
    category: "Effective C++",
    title: "29. Effective C++ 項29 (Item 29)",
    description: "項29: 例外安全なコードを目指してください。例外が発生しても、リソースがリークせず、データ構造が壊れないようにする必要があります。「強い保証」（操作が成功するか、失敗しても元の状態を維持するか）はしばしば `copy-and-swap` 手法で達成されます。",
    task: "`PrettyMenu::changeBackground` を `copy-and-swap` パターンを用いて書き換え、「強い例外保証」を提供してください。",
    initialCode: `#include <iostream>
#include <vector>
#include <memory>

struct Image { Image(std::vector<char> d) {} };

class PrettyMenu {
public:
    void changeBackground(std::vector<char>& imgData) {
        // --- TODO: copy-and-swap を使用して例外安全にしてください ---
        ++changeCount;
        delete bgImage;
        bgImage = new Image(imgData); // ここで例外が投げられると count だけ増えて image は壊れる
    }

private:
    Image* bgImage = nullptr;
    int changeCount = 0;
};

int main() {
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `PrettyMenuImpl` のような構造体を作り、そこにデータを集約します。 2. `changeBackground` 内でコピーを作り、ポインタを `swap` または付け替えます。",
    solution: `void changeBackground(std::vector<char>& imgData) {
    std::unique_ptr<Image> pNew(new Image(imgData));
    // ここで例外が出ても member は変わらない
    std::swap(bgImage, pNew.release()); 
    ++changeCount;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("swap") || code.includes("delete bgImage;\n        bgImage = new Image")) {
          return "テスト失敗: 強い例外保証を提供するには、新しいデータを先に準備し、最後に `swap`（またはポインタの入れ替え）を行う手法を検討してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-30",
    category: "Effective C++",
    title: "30. Effective C++ 項30 (Item 30)",
    description: "項30: インライン化の裏表を把握してください。`inline` はコンパイラへの「要求」ではなく「助言」であり、複雑な関数（ループがある、再帰的である等）や仮想関数はインライン化されないことが多いです。また、インライン化しすぎるとコードサイズが膨張し、キャッシュヒット率が下がる可能性があります。",
    task: "`Person` クラスのゲッターをインライン化し、重い処理を行う関数はアウトライン（ソースファイルへ移動）することを検討してください（ここではコメントでの指示に従ってください）。",
    initialCode: `#include <iostream>
#include <string>

class Person {
public:
    // --- TODO: これをインライン関数にしてください ---
    int age() const { return theAge; }

    // --- TODO: ここでは定義せず、宣言のみにしてインライン化を避けてください ---
    void longComplexOperation() {
        for(int i=0; i<1000; ++i) { /* 複雑な処理 */ }
    }

private:
    int theAge = 20;
};

int main() {
    Person p;
    std::cout << p.age() << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `int age() const` の前に `inline` を付けます（またはクラス内定義のままにします）。 2. `longComplexOperation` は宣言のみにし、定義をクラスの外に移動します。",
    solution: `class Person {
public:
    inline int age() const { return theAge; }
    void longComplexOperation();
private:
    int theAge = 20;
};

void Person::longComplexOperation() {
    for(int i=0; i<1000; ++i) { /* 複雑な処理 */ }
}`,
    clientValidation: (code: string) => {
      if (code.includes("void longComplexOperation() {")) {
          return "テスト失敗: `longComplexOperation` のような複雑な関数は、クラス定義内で定義（＝暗黙のインライン化）せず、別途定義することを推奨します。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-31",
    category: "Effective C++",
    title: "31. Effective C++ 項31 (Item 31)",
    description: "項31: コンパイルの依存関係を最小限に抑えてください。実装の詳細をヘッダファイルから隠すために `Pimpl` (Pointer to implementation) パターンを使用するか、インターフェースクラス（抽象基底クラス）を使用します。",
    task: "`Person` クラスを `Pimpl` パターンを使用してリファクタリングし、`Person.h` が `Address` や `Date` などの詳細なクラス定義に依存しなくて済むようにしてください。",
    initialCode: `#include <iostream>
#include <string>
#include <memory>

// 詳細なクラス（本当は別ヘッダにある想定）
class Address {};
class Date {};

// --- TODO: Pimpl パターンを適用してください ---
class Person {
public:
    Person();
    std::string name() const;
    std::string birthDate() const;
    std::string address() const;

private:
    // これらの詳細がヘッダにあると、変更時に再コンパイルが必要になる
    std::string theName;
    Date theBirthDate;
    Address theAddress;
};

int main() {
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `PersonImpl` 構造体を定義し、データメンバをすべてそこに移動します。 2. `Person` クラスは `std::shared_ptr<PersonImpl> pImpl;` のみを持つようにします。",
    solution: `struct PersonImpl {
    std::string theName;
    Date theBirthDate;
    Address theAddress;
};

class Person {
public:
    Person() : pImpl(std::make_shared<PersonImpl>()) {}
    // ...各関数は pImpl を介して処理する...
private:
    std::shared_ptr<PersonImpl> pImpl;
};`,
    clientValidation: (code: string) => {
      if (!code.includes("struct PersonImpl") && !code.includes("class PersonImpl")) {
          return "テスト失敗: `PersonImpl` クラスを定義して、実装の詳細をそこに移動させてください。";
      }
      if (!code.includes("pImpl")) {
          return "テスト失敗: `shared_ptr` または生のポインタで `PersonImpl` へのポインタを持つ必要があります。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-32",
    category: "Effective C++",
    title: "32. Effective C++ 項32 (Item 32)",
    description: "項32: 公開継承 (public inheritance) は \"is-a\" 関係をモデル化するようにしてください。基底クラスに適用できることはすべて、派生クラスにも適用できなければなりません。（例：鳥は飛べるが、ダチョウは飛ばないなら、鳥クラスに `fly()` を入れるのは不適切かもしれません）",
    task: "`Bird` と `Penguin` の関係を正しくモデル化してください。ペンギンは鳥ですが飛べません。`fly()` メソッドの扱いに注意してください。",
    initialCode: `#include <iostream>
#include <stdexcept>

class Bird {
public:
    virtual void fly() { std::cout << "Bird flying" << std::endl; }
};

// --- TODO: ペンギンは飛べないことを考慮してモデル化してください ---
class Penguin : public Bird {
};

int main() {
    Bird* pb = new Penguin();
    // pb->fly(); // ペンギンなのに飛べてしまう、あるいはランタイムエラーになるべき？
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `Bird` クラスから `fly` を削除するか、飛行可能な鳥だけが `fly` を持つ別の階層を検討します。 2. ペンギンは `Bird` ですが `fly` は実行時エラーを投げるか、そもそも持たないように設計します。",
    solution: `class Bird {
public:
    virtual ~Bird() {}
};

class FlyingBird : public Bird {
public:
    virtual void fly() { std::cout << "Bird flying" << std::endl; }
};

class Penguin : public Bird {
    // fly() を持たない、または「飛べない」ことを明示する
};`,
    clientValidation: (code: string) => {
      if (code.includes("class Penguin : public Bird") && !code.includes("fly") && !code.includes("throw")) {
          // 何もしないと親の fly が呼ばれてしまう
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-33",
    category: "Effective C++",
    title: "33. Effective C++ 項33 (Item 33)",
    description: "項33: 継承された名前を隠さないようにしてください。派生クラスで基底クラスの関数と同じ名前の関数を定義すると、引数が異なっていても（オーバーロードであっても）基底クラスの関数が隠されてしまいます。",
    task: "`Derived` クラスで `using` 宣言を使用して、隠されてしまった基底クラス `Base` の `mf1` を見えるようにしてください。",
    initialCode: `#include <iostream>

class Base {
public:
    virtual void mf1() = 0;
    virtual void mf1(int) { std::cout << "Base::mf1(int)" << std::endl; }
};

class Derived : public Base {
public:
    // --- TODO: ここに Base の mf1 を見えるようにする宣言を追加してください ---
    
    virtual void mf1() override { std::cout << "Derived::mf1()" << std::endl; }
};

int main() {
    Derived d;
    int x = 5;
    d.mf1();
    d.mf1(x); // エラー: Derived::mf1 が Base::mf1(int) を隠している
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `Derived` クラスの中で `using Base::mf1;` と書きます。 2. これにより、オーバーロードされた基底クラスの関数が隠蔽されるのを防げます。",
    solution: `class Derived : public Base {
public:
    using Base::mf1; // Base::mf1(int) を再導入
    virtual void mf1() override { std::cout << "Derived::mf1()" << std::endl; }
};`,
    clientValidation: (code: string) => {
      if (!code.includes("using Base::mf1;")) {
          return "テスト失敗: `using Base::mf1;` を使用して、隠された関数を再導入してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-34",
    category: "Effective C++",
    title: "34. Effective C++ 項34 (Item 34)",
    description: "項34: インターフェースの継承と実装の継承を区別してください。純粋仮想関数はインターフェースのみ、単純仮想関数はインターフェースとデフォルト実装、非仮想関数はインターフェースと必須の実装を継承させることを意味します。",
    task: "`Shape` クラスをリファクタリングして、`draw` は必須の実装なし（純粋仮想）、`error` はデフォルト実装あり（単純仮想）、`objectID` は変更不可（非仮想）という意図を表現してください。",
    initialCode: `#include <iostream>

class Shape {
public:
    // --- TODO: インターフェースと実装の使い分けを正しく行ってください ---
    virtual void draw() = 0;
    virtual void error(const std::string& msg);
    int objectID() const;
};

int main() {
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `draw` は `= 0` を付けて純粋仮想関数にします。 2. `error` は `virtual` ですがデフォルト実装を持ちます。 3. `objectID` は `virtual` を付けずに非仮想関数として定義します。",
    solution: `class Shape {
public:
    virtual void draw() = 0; // インターフェースのみ
    virtual void error(const std::string& msg) { /* デフォルト */ } // インターフェース + デフォルト実装
    int objectID() const { return 123; } // インターフェース + 必須の実装
};`,
    clientValidation: () => {
      // 構造チェック
      return null;
    }
  },
  {
    id: "effective-cpp-item-35",
    category: "Effective C++",
    title: "35. Effective C++ 項35 (Item 35)",
    description: "項35: 仮想関数の代わりとなる手法を検討してください。Strategy パターン（関数ポインタや `std::function` を使用）、あるいはテンプレートを用いた静的なポリモーフィズムなどがあります。",
    task: "`GameCharacter` の体力を計算するロジックを仮想関数ではなく、`std::function` を使用した Strategy パターンにリファクタリングしてください。",
    initialCode: `#include <iostream>
#include <functional>

class GameCharacter;
int defaultHealthCalc(const GameCharacter& gc) { return 100; }

class GameCharacter {
public:
    // --- TODO: 仮想関数の代わりに std::function を使用してください ---
    explicit GameCharacter( /* ... */ ) {}
    virtual int healthValue() const { return 100; }
};

int main() {
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `GameCharacter` のコンストラクタで `std::function<int(const GameCharacter&)>` を受け取るようにします。 2. `healthValue` 関数はこの関数オブジェクトを呼び出すようにします。",
    solution: `class GameCharacter {
public:
    using HealthCalcFunc = std::function<int(const GameCharacter&)>;
    explicit GameCharacter(HealthCalcFunc hcf = defaultHealthCalc)
        : healthFunc(hcf) {}

    int healthValue() const { return healthFunc(*this); }

private:
    HealthCalcFunc healthFunc;
};`,
    clientValidation: (code: string) => {
      if (!code.includes("std::function")) {
          return "テスト失敗: `std::function` を使用して計算ロジックを外部から注入できるようにしてください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-36",
    category: "Effective C++",
    title: "36. Effective C++ 項36 (Item 36)",
    description: "項36: 継承された非仮想関数を再定義しないでください。非仮想関数は派生クラスで不変であるべき「不変条件」を表現しています。これを再定義すると、ポインタの型によって振る舞いが変わるという矛盾が生じ、利用者を混乱させます。",
    task: "`Derived` クラスによる `Base::mf` の再定義を修正してください。`mf` が共通の振る舞いであるべきなら継承し、振る舞いを変える必要があるなら基底クラスで `virtual` にすることを検討します（ここでは仮想関数に変更してください）。",
    initialCode: `#include <iostream>

class Base {
public:
    void mf() { std::cout << "Base::mf" << std::endl; }
};

class Derived : public Base {
public:
    // --- TODO: 非仮想関数の再定義を避け、意図を明確にしてください ---
    void mf() { std::cout << "Derived::mf" << std::endl; }
};

int main() {
    Derived d;
    Base* pb = &d;
    Derived* pd = &d;
    pb->mf(); // Base::mf が呼ばれる
    pd->mf(); // Derived::mf が呼ばれる（一貫性がない）
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. 基底クラスの `mf` を `virtual` に変更します。 2. 派生クラスで `override` キーワードを付けて再定義（オーバーライド）します。",
    solution: `class Base {
public:
    virtual void mf() { std::cout << "Base::mf" << std::endl; }
};

class Derived : public Base {
public:
    virtual void mf() override { std::cout << "Derived::mf" << std::endl; }
};`,
    clientValidation: (code: string) => {
      if (code.includes("class Base {\npublic:\n    void mf()")) {
          return "テスト失敗: 基底クラスで `virtual` を宣言するか、派生クラスでの再定義をやめてください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-37",
    category: "Effective C++",
    title: "37. Effective C++ 項37 (Item 37)",
    description: "項37: 継承された関数のデフォルト引数を再定義しないでください。仮想関数は動的に結合（ダイナミックバインディング）されますが、デフォルト引数は静的に結合（スタティックバインディング）されます。そのため、派生クラスの関数が基底クラスのデフォルト引数で呼び出されるという奇妙な現象が起きます。",
    task: "デフォルト引数を持つ仮想関数の問題を回避するため、NVI (Non-Virtual Interface) パターンを使用して、非仮想関数でデフォルト引数を指定し、実際の処理を private 仮想関数で行うようにリファクタリングしてください。",
    initialCode: `#include <iostream>

class Shape {
public:
    enum ShapeColor { Red, Green, Blue };
    // --- TODO: デフォルト引数を持つ仮想関数を避けてリファクタリングしてください ---
    virtual void draw(ShapeColor color = Red) const = 0;
};

class Rectangle : public Shape {
public:
    // --- TODO: デフォルト引数を再定義しないでください ---
    virtual void draw(ShapeColor color = Green) const override {
        std::cout << "Drawing Rectangle with color " << color << std::endl;
    }
};

int main() {
    Shape* ps = new Rectangle();
    ps->draw(); // Rectangle の描画なのに、デフォルト引数は Shape の Red になる
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. 基底クラスに `void draw(ShapeColor color = Red)` という非仮想関数を作ります。 2. その中で `doDraw(color)` という純粋仮想関数を呼び出します（NVIパターン）。",
    solution: `class Shape {
public:
    enum ShapeColor { Red, Green, Blue };
    void draw(ShapeColor color = Red) const { doDraw(color); }
private:
    virtual void doDraw(ShapeColor color) const = 0;
};

class Rectangle : public Shape {
private:
    virtual void doDraw(ShapeColor color) const override {
        std::cout << "Drawing Rectangle with color " << color << std::endl;
    }
};`,
    clientValidation: (code: string) => {
      if (code.match(/virtual\s+void\s+draw\s*\(.*=.*\)/)) {
          return "テスト失敗: 仮想関数にデフォルト引数を持たせないでください。NVI パターン（非仮想の public 関数から private 仮想関数を呼ぶ）を検討してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-38",
    category: "Effective C++",
    title: "38. Effective C++ 項38 (Item 38)",
    description: "項38: 合成を活用して \"has-a\" または \"is-implemented-in-terms-of\" をモデル化してください。公開継承は \"is-a\" ですが、あるクラスを使って別のクラスを実装したい場合（例：リストを使ってセットを作る）は、継承ではなくメンバ変数として保持（合成）すべきです。",
    task: "`std::list` を継承して `Set` クラスを作るのではなく、`std::list` をメンバ変数として保持する形にリファクタリングしてください。",
    initialCode: `#include <iostream>
#include <list>
#include <algorithm>

// --- TODO: 継承ではなく合成 (composition) を使用してください ---
template<typename T>
class Set : public std::list<T> {
public:
    bool insert(const T& item) {
        if (std::find(this->begin(), this->end(), item) == this->end()) {
            this->push_back(item);
            return true;
        }
        return false;
    }
};

int main() {
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. 継承を削除し、`private:` セクションに `std::list<T> elements;` を追加します。 2. `insert` 関数内でその `elements` を操作するように変更します。",
    solution: `template<typename T>
class Set {
public:
    bool insert(const T& item) {
        if (std::find(elements.begin(), elements.end(), item) == elements.end()) {
            elements.push_back(item);
            return true;
        }
        return false;
    }
private:
    std::list<T> elements;
};`,
    clientValidation: (code: string) => {
      if (code.includes("class Set : public std::list")) {
          return "テスト失敗: `Set` は `list` ではありません (is-a ではない)。`list` を private メンバとして持ってください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-39",
    category: "Effective C++",
    title: "39. Effective C++ 項39 (Item 39)",
    description: "項39: 非公開継承 (private inheritance) は慎重に使用してください。これは \"is-implemented-in-terms-of\" を意味し、合成よりも結合度が強くなります。主に、EBO (Empty Base Optimization) を利用したい場合や、protected メンバにアクセスしたい場合に使用されます。",
    task: "`Timer` クラスの機能を `Widget` で利用したいが、`Widget` は `Timer` ではない場合を考えます。合成が基本ですが、ここでは練習として private 継承を使用し、基底クラスの `onTick` をオーバーライドしてください。",
    initialCode: `#include <iostream>

class Timer {
public:
    virtual void onTick() const { std::cout << "Tick" << std::endl; }
};

// --- TODO: private 継承を使用して実装の詳細を隠してください ---
class Widget : public Timer {
public:
    virtual void onTick() const override {
        std::cout << "Widget specialized tick" << std::endl;
    }
};

int main() {
    Widget w;
    // Timer* pt = &w; // private 継承ならこれはエラーになるはず
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `class Widget : private Timer` と記述して private 継承を行います。 2. これにより、外部からは `Widget` が `Timer` であることが見えなくなります。",
    solution: `class Widget : private Timer {
public:
    virtual void onTick() const override {
        std::cout << "Widget specialized tick" << std::endl;
    }
};`,
    clientValidation: (code: string) => {
      if (code.includes("class Widget : public Timer")) {
          return "テスト失敗: `public` 継承ではなく `private` 継承を使用してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-40",
    category: "Effective C++",
    title: "40. Effective C++ 項40 (Item 40)",
    description: "項40: 多重継承は慎重に使用してください。名前の衝突や「ダイヤモンド継承」の問題が発生する可能性があります。ダイヤモンド継承による重複を防ぐには `virtual` 継承を使用しますが、これにはコストが伴います。多重継承が真に適切なのは、一方をインターフェース、他方を実装の継承とするような場合です。",
    task: "ダイヤモンド継承の問題を解決するために、`File` クラスを `virtual` 継承するように `InputFile` と `OutputFile` を修正してください。",
    initialCode: `#include <iostream>

class File {
public:
    int fileName;
};

// --- TODO: virtual 継承を適用してください ---
class InputFile : public File {};
class OutputFile : public File {};

class IOFile : public InputFile, public OutputFile {};

int main() {
    IOFile iof;
    // iof.fileName = 1; // 曖昧さによりエラーになる
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `InputFile` と `OutputFile` の継承宣言に `virtual` を追加します（例: `class InputFile : virtual public File`）。",
    solution: `class InputFile : virtual public File {};
class OutputFile : virtual public File {};

class IOFile : public InputFile, public OutputFile {};`,
    clientValidation: (code: string) => {
      if (!code.includes("virtual public File") && !code.includes("public virtual File")) {
          return "テスト失敗: ダイヤモンド継承の問題を避けるために `virtual` 継承を使用してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-41",
    category: "Effective C++",
    title: "41. Effective C++ 項41 (Item 41)",
    description: "項41: テンプレートにおける「暗黙のインターフェース」と「コンパイル時ポリモーフィズム」を理解してください。クラスの継承における明確なインターフェースとは異なり、テンプレートでは使用される関数や演算子が有効であれば、どのような型でも受け入れることができます。",
    task: "`doProcessing` テンプレート関数が要求している暗黙のインターフェースを見極め、それを満たすように `Widget` クラスを修正してください。",
    initialCode: `#include <iostream>

class Widget {
public:
    // --- TODO: テンプレート関数が要求するインターフェースを実装してください ---
    // 要求1: size() メソッド
    // 要求2: operator!=
    // 要求3: copy constructor (値渡し用)
};

template<typename T>
void doProcessing(T& w) {
    if (w.size() > 10 && w != Widget()) {
        T temp(w);
        // ...
    }
}

int main() {
    Widget w;
    // doProcessing(w);
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `Widget` クラスに `std::size_t size() const` メソッドを追加します。 2. `bool operator!=(const Widget& rhs) const` をオーバーロードします。 3. デフォルトコンストラクタとコピーコンストラクタが利用可能であることを確認します。",
    solution: `class Widget {
public:
    std::size_t size() const { return 10; }
    bool operator!=(const Widget& rhs) const { return false; }
    // デフォルトコンストラクタとコピーコンストラクタは自動生成されるものでOK
};`,
    clientValidation: (code: string) => {
      if (!code.includes("size()") || !code.includes("operator!=")) {
          return "テスト失敗: `size()` メソッドと `operator!=` を `Widget` クラスに実装してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-42",
    category: "Effective C++",
    title: "42. Effective C++ 項42 (Item 42)",
    description: "項42: `typename` の二つの意味を理解してください。テンプレートの宣言では `class` と同じ意味ですが、テンプレート内で「依存名（型名）」を指定する場合は、コンパイラにそれが型であることを伝えるために必須となります。",
    task: "テンプレート関数内で依存名 `T::const_iterator` を使用する際に、正しく `typename` を追加してください。",
    initialCode: `#include <iostream>
#include <vector>

template<typename C>
void print2nd(const C& container) {
    if (container.size() >= 2) {
        // --- TODO: typename を正しく使用してください ---
        C::const_iterator iter(container.begin());
        ++iter;
        int value = *iter;
        std::cout << value << std::endl;
    }
}

int main() {
    std::vector<int> v = {1, 2, 3};
    print2nd(v);
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `C::const_iterator` の前に `typename` を付けます。 2. これにより、コンパイラに対して `const_iterator` が「型」であることを明示できます。",
    solution: `template<typename C>
void print2nd(const C& container) {
    if (container.size() >= 2) {
        typename C::const_iterator iter(container.begin());
        ++iter;
        int value = *iter;
        std::cout << value << std::endl;
    }
}`,
    clientValidation: (code: string) => {
      if (!code.includes("typename C::const_iterator")) {
          return "テスト失敗: コンパイラが `C::const_iterator` を型として認識できるように `typename` を付加してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-43",
    category: "Effective C++",
    title: "43. Effective C++ 項43 (Item 43)",
    description: "項43: テンプレート基底クラス内の名前へのアクセス方法を理解してください。基底クラスがテンプレートの場合、コンパイラはそれが具体的にどのような名前を持っているか（特殊化される可能性があるため）知りません。そのため `this->` や `using` 宣言が必要です。",
    task: "`LoggingMsgSender::sendClear` 関数から基底クラス `MsgSender` の `sendClear` を呼び出せるように、`this->` または `using` 宣言を追加してください。",
    initialCode: `#include <iostream>
#include <string>

template<typename Company>
class MsgSender {
public:
    void sendClear(const std::string& info) { std::cout << "Sending clear info" << std::endl; }
};

template<typename Company>
class LoggingMsgSender : public MsgSender<Company> {
public:
    void sendClearMsg(const std::string& info) {
        std::cout << "Log: Sending..." << std::endl;
        // --- TODO: 基底クラスの sendClear を見えるようにしてください ---
        sendClear(info); // コンパイルエラーになる可能性があります
    }
};

int main() {
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `sendClear(info);` を `this->sendClear(info);` に書き換えるか、クラス内に `using MsgSender<Company>::sendClear;` と記述します。",
    solution: `template<typename Company>
class LoggingMsgSender : public MsgSender<Company> {
public:
    using MsgSender<Company>::sendClear; // 推奨
    void sendClearMsg(const std::string& info) {
        std::cout << "Log: Sending..." << std::endl;
        sendClear(info); 
    }
};`,
    clientValidation: (code: string) => {
      if (!code.includes("this->sendClear") && !code.includes("using MsgSender<Company>::sendClear")) {
          return "テスト失敗: テンプレート基底クラスのメンバにアクセスするには `this->` を付けるか、`using` 宣言を行ってください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-44",
    category: "Effective C++",
    title: "44. Effective C++ 項44 (Item 44)",
    description: "項44: テンプレートによる「コードの膨張」を防ぐために、パラメータに依存しないコードを外に出してください。例えば、行列のサイズをテンプレート引数にすると、サイズごとに別々のコードが生成されてしまいます。",
    task: "サイズに依存する `Inversion` 計算ロジックを、サイズを引数で受け取る非テンプレートの基底クラスに移動させることで、コードサイズを節約してください。",
    initialCode: `#include <iostream>

// --- TODO: サイズに依存しない基底クラスを作成してください ---
template<typename T, std::size_t n>
class SquareMatrix {
public:
    void invert() { /* サイズ n ごとに別々に生成される重い処理 */ }
};

int main() {
    SquareMatrix<double, 5> sm1;
    SquareMatrix<double, 10> sm2;
    sm1.invert();
    sm2.invert();
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `invert` 処理を行う `SquareMatrixBase` クラスを作成し、そこではサイズを引数で受け取るように設計します。 2. `SquareMatrix` はその基底クラスを継承し、自身のサイズを渡します。",
    solution: `template<typename T>
class SquareMatrixBase {
protected:
    void invert(std::size_t matrixSize) { /* 共通の重い処理 */ }
};

template<typename T, std::size_t n>
class SquareMatrix : private SquareMatrixBase<T> {
public:
    void invert() { this->invert(n); }
};`,
    clientValidation: (code: string) => {
      if (!code.includes("class SquareMatrixBase")) {
          return "テスト失敗: 非テンプレートの基底クラス（または引数でサイズを受け取るクラス）を作成し、共通の処理を移動させてください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-45",
    category: "Effective C++",
    title: "45. Effective C++ 項45 (Item 45)",
    description: "項45: 互換性のあるすべての型を受け入れるために、「メンバ関数テンプレート」を使用してください。これにより、`SmartPtr<Derived>` から `SmartPtr<Base>` への暗黙の変換など、ポインタのような振る舞いを実現できます。",
    task: "`SmartPtr` に「汎用コピーコンストラクタ」を実装して、派生クラスへのポインタを持つ `SmartPtr` を、基底クラスへのポインタを持つ `SmartPtr` にコピーできるようにしてください。",
    initialCode: `#include <iostream>

template<typename T>
class SmartPtr {
public:
    explicit SmartPtr(T* realPtr) : heldPtr(realPtr) {}

    // --- TODO: 汎用コピーコンストラクタを実装してください ---
    // template<typename U>
    // SmartPtr(const SmartPtr<U>& other) : heldPtr(other.get()) {}

    T* get() const { return heldPtr; }

private:
    T* heldPtr;
};

class Base {};
class Derived : public Base {};

int main() {
    SmartPtr<Derived> pDerived(new Derived());
    SmartPtr<Base> pBase(pDerived); // これを可能にします
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `SmartPtr` クラス内に `template<typename U> SmartPtr(const SmartPtr<U>& other) : heldPtr(other.get()) {}` というコンストラクタを追加します。",
    solution: `template<typename T>
class SmartPtr {
public:
    explicit SmartPtr(T* realPtr) : heldPtr(realPtr) {}

    // 汎用コピーコンストラクタ
    template<typename U>
    SmartPtr(const SmartPtr<U>& other) : heldPtr(other.get()) {}

    T* get() const { return heldPtr; }

private:
    T* heldPtr;
};`,
    clientValidation: (code: string) => {
      if (!code.match(/template\s*<\s*typename\s+U\s*>\s*SmartPtr/)) {
          return "テスト失敗: `template<typename U>` を用いた汎用コピーコンストラクタを実装してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-46",
    category: "Effective C++",
    title: "46. Effective C++ 項46 (Item 46)",
    description: "項46: 型変換が必要な場合は、テンプレート内に「非メンバ関数」を定義してください。テンプレートクラスの引数に対して暗黙の型変換（例: `Rational<int> * 2`）を適用したい場合、その関数をフレンド関数としてテンプレートクラス内で定義するのが最も確実な方法です。",
    task: "`Rational` テンプレートクラス内で、`operator*` をフレンド関数として定義し、混合演算（例：Rational<int> と int の掛け算）をサポートしてください。",
    initialCode: `#include <iostream>

template<typename T>
class Rational {
public:
    Rational(T numerator = 0, T denominator = 1) : n(numerator), d(denominator) {}
    T numerator() const { return n; }
    T denominator() const { return d; }

    // --- TODO: ここに friend operator* を定義してください ---

private:
    T n, d;
};

int main() {
    Rational<int> oneHalf(1, 2);
    Rational<int> result = oneHalf * 2; // これを可能にします
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `Rational` クラス内に `friend const Rational operator*(const Rational& lhs, const Rational& rhs) { ... }` を定義します。 2. フレンド関数として記述することで、両方の引数に型変換が適用されます。",
    solution: `template<typename T>
class Rational {
public:
    Rational(T numerator = 0, T denominator = 1) : n(numerator), d(denominator) {}
    
    friend const Rational operator*(const Rational& lhs, const Rational& rhs) {
        return Rational(lhs.n * rhs.n, lhs.d * rhs.d);
    }
private:
    T n, d;
};`,
    clientValidation: (code: string) => {
      if (!code.includes("friend const Rational operator*")) {
          return "テスト失敗: テンプレートクラス内で `friend` を用いて `operator*` を定義してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-47",
    category: "Effective C++",
    title: "47. Effective C++ 項47 (Item 47)",
    description: "項47: 型に関する情報が必要な場合は、`traits` クラスを使用してください。例えば、イテレータのカテゴリ（ランダムアクセス可能か等）に応じて最適なアルゴリズムを選択するために、`std::iterator_traits` が利用されます。",
    task: "イテレータのカテゴリを判別するために `iterator_traits` を使用し、`RandomAccessIterator` の場合は `+=` を、そうでない場合は `++` を繰り返すように `doAdvance` 関数を実装してください。",
    initialCode: `#include <iostream>
#include <iterator>
#include <vector>
#include <list>

template<typename Iter, typename Dist>
void doAdvance(Iter& iter, Dist d) {
    // --- TODO: iterator_traits を使用して最適な前進方法を選択してください ---
    // if random access iterator: iter += d;
    // else: while(d--) ++iter;
}

int main() {
    std::vector<int> v = {1, 2, 3};
    auto it = v.begin();
    doAdvance(it, 2);
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `typename std::iterator_traits<Iter>::iterator_category` を取得し、それが `std::random_access_iterator_tag` であるかチェックします。",
    solution: `template<typename Iter, typename Dist>
void doAdvance(Iter& iter, Dist d) {
    using category = typename std::iterator_traits<Iter>::iterator_category;
    if (std::is_base_of<std::random_access_iterator_tag, category>::value) {
        iter += d;
    } else {
        while (d--) ++iter;
    }
}`,
    clientValidation: (code: string) => {
      if (!code.includes("iterator_traits") || !code.includes("iterator_category")) {
          return "テスト失敗: `std::iterator_traits<Iter>::iterator_category` を使用して型情報を取得してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-48",
    category: "Effective C++",
    title: "48. Effective C++ 項48 (Item 48)",
    description: "項48: テンプレートメタプログラミング (TMP) を理解してください。TMP はコンパイル時に計算を行う手法であり、実行時の負荷を減らし、型の安全性を高めることができます（例：コンパイル時の階乗計算や次元解析）。",
    task: "コンパイル時に関数 `Factorial<n>::value` が階乗の結果を持つように、テンプレートメタプログラミングを用いて実装してください。",
    initialCode: `#include <iostream>

// --- TODO: テンプレートメタプログラミングで階乗を実装してください ---
template<unsigned n>
struct Factorial {
    enum { value = n * Factorial<n-1>::value };
};

// 終了条件（特殊化）
template<>
struct Factorial<0> {
    enum { value = 1 };
};

int main() {
    std::cout << Factorial<5>::value << std::endl; // 120
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    if (Factorial<5>::value == 120) {
        std::cout << "TEST_PASSED" << std::endl;
    } else {
        std::cout << "TEST_FAILED" << std::endl;
    }
    return 0;
}
`,
    hint: "1. `Factorial<n>` 構造体の中で `value = n * Factorial<n-1>::value` を定義します。 2. `Factorial<0>` を特殊化して `value = 1` とします。",
    solution: `template<unsigned n>
struct Factorial {
    enum { value = n * Factorial<n-1>::value };
};

template<>
struct Factorial<0> {
    enum { value = 1 };
};`,
    clientValidation: (code: string) => {
      if (!code.includes("struct Factorial<0>")) {
          return "テスト失敗: 再帰の終了条件として `Factorial<0>` の特殊化を定義してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-49",
    category: "Effective C++",
    title: "49. Effective C++ 項49 (Item 49)",
    description: "項49: `new-handler` の動作を理解してください。メモリ割り当てに失敗したとき、`operator new` は例外を投げる前に、`set_new_handler` で指定された関数を呼び出します。ここを使用してメモリを解放したり、ログを記録したりできます。",
    task: "`outOfMemory` 関数を `new_handler` として設定し、メモリ不足時にメッセージを表示するようにしてください。",
    initialCode: `#include <iostream>
#include <new>

void outOfMemory() {
    std::cerr << "Unable to satisfy request for memory" << std::endl;
    std::abort();
}

int main() {
    // --- TODO: outOfMemory を new-handler としてください ---

    // 巨大な割り当てを試みる
    // int* pBigData = new int[1000000000L];
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `std::set_new_handler(outOfMemory);` と記述します。 2. これにより、実行時にメモリが確保できなかった際にその関数が呼ばれます。",
    solution: `int main() {
    std::set_new_handler(outOfMemory);
    // ...
    return 0;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("std::set_new_handler")) {
          return "テスト失敗: `std::set_new_handler` を使用してハンドラを設定してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-50",
    category: "Effective C++",
    title: "50. Effective C++ 項50 (Item 50)",
    description: "項50: `new` と `delete` をいつ置換すべきか理解してください。カスタムの `operator new/delete` を提供する理由には、パフォーマンスの向上（フラグメンテーションの回避）、エラーの検出（境界チェック）、統計情報の収集などがあります。",
    task: "`Widget` クラスに対して、独自の `operator new` をオーバーロードし、割り当てられたサイズを `std::cout` に出力するようにしてください。",
    initialCode: `#include <iostream>
#include <new>

class Widget {
public:
    // --- TODO: operator new をオーバーロードしてください ---
};

int main() {
    Widget* pw = new Widget();
    delete pw;
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `static void* operator new(std::size_t size)` を定義し、中で `std::malloc(size)` などを呼び出します。",
    solution: `class Widget {
public:
    static void* operator new(std::size_t size) {
        std::cout << "Allocating " << size << " bytes" << std::endl;
        return std::malloc(size);
    }
    static void operator delete(void* pMem) {
        std::free(pMem);
    }
};`,
    clientValidation: (code: string) => {
      if (!code.includes("static void* operator new")) {
          return "テスト失敗: `static void* operator new(std::size_t size)` を実装してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-51",
    category: "Effective C++",
    title: "51. Effective C++ 項51 (Item 51)",
    description: "項51: `operator new` と `operator delete` を作成する際の慣習を遵守してください。`operator new` は、サイズが 0 の要求に対しても有効なポインタを返し、メモリが不足した場合は `new-handler` を呼ぶループを持つべきです。`operator delete` は、ヌルポインタが渡された場合に何もしないようにする必要があります。",
    task: "標準的な慣習に従った `operator new` の基本構造（無限ループと `new-handler` の呼び出し）を実装してください。",
    initialCode: `#include <iostream>
#include <new>

class Base {
public:
    static void* operator new(std::size_t size) throw(std::bad_alloc) {
        if (size == 0) size = 1; // 0バイト要求の処理
        
        while (true) {
            // --- TODO: メモリの割り当てを試行し、失敗したら new-handler を呼んでください ---
            void* pMem = std::malloc(size);
            if (pMem) return pMem;
            
            // 割り当て失敗時の処理
            // std::new_handler globalHandler = std::set_new_handler(0);
            // std::set_new_handler(globalHandler);
            // if (globalHandler) (*globalHandler)(); else throw std::bad_alloc();
        }
    }
    
    static void operator delete(void* pMemory) throw() {
        // --- TODO: ヌルポインタの安全な処理を行ってください ---
        std::free(pMemory);
    }
};

int main() {
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "「operator new」の実装では、メモリ割り当てが成功するまでループ（while(true)）を回し、失敗した場合は「new-handler」を呼び出してメモリ確保のチャンスを与える必要があります。また、「operator delete」ではヌルポインタのチェックを行ってください。",
    solution: `class Base {
public:
    static void* operator new(std::size_t size) throw(std::bad_alloc) {
        if (size == 0) size = 1;
        while (true) {
            void* pMem = std::malloc(size);
            if (pMem) return pMem;
            
            std::new_handler globalHandler = std::get_new_handler();
            if (globalHandler) (*globalHandler)();
            else throw std::bad_alloc();
        }
    }
    
    static void operator delete(void* pMemory) throw() {
        if (pMemory == 0) return;
        std::free(pMemory);
    }
};`,
    clientValidation: (code: string) => {
      if (!code.includes("if (pMemory == 0)") && !code.includes("if (!pMemory)")) {
          return "テスト失敗: `operator delete` では、ヌルポインタが渡された場合に安全に復帰するようにチェックを追加してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-52",
    category: "Effective C++",
    title: "52. Effective C++ 項52 (Item 52)",
    description: "項52: 「配置 new」(placement new) を作成した場合は、「配置 delete」も作成してください。特定の引数を取る `operator new` を定義した場合、対応する引数を取る `operator delete` がないと、コンストラクタで例外が発生したときにメモリリークが発生します。",
    task: "カスタムの引数を取る `operator new` に対し、対応する `operator delete` を定義してください。",
    initialCode: `#include <iostream>
#include <ostream>

class Widget {
public:
    static void* operator new(std::size_t size, std::ostream& log) throw(std::bad_alloc) {
        log << "Allocating Widget" << std::endl;
        return ::operator new(size);
    }

    // --- TODO: 対応する配置 delete を定義してください ---
    // static void operator delete(void* pMemory, std::ostream& log) throw();
};

int main() {
    // Widget* pw = new (std::cerr) Widget; // 例外が発生するとリークする恐れがある
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "特定の引数を取る「配置 new」（例：`operator new(std::size_t, std::ostream&)`）を定義した場合、コンストラクタが例外を投げた際にメモリリークを防ぐため、同じ引数を取る「配置 delete」も定義する必要があります。",
    solution: `class Widget {
public:
    static void* operator new(std::size_t size, std::ostream& log) throw(std::bad_alloc) {
        log << "Allocating Widget" << std::endl;
        return ::operator new(size);
    }
    
    // 対応する配置 delete
    static void operator delete(void* pMemory, std::ostream& log) throw() {
        ::operator delete(pMemory);
    }
};`,
    clientValidation: (code: string) => {
      if (!code.includes("operator delete(void*") || !code.includes("std::ostream&")) {
          return "テスト失敗: 配置 new に対応する、`std::ostream&` を引数に取る `operator delete` を定義してください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-53",
    category: "Effective C++",
    title: "53. Effective C++ 項53 (Item 53)",
    description: "項53: コンパイラの警告を無視しないでください。C++ コンパイラは、潜在的なバグ（変数の未初期化、型変換による情報の消失、仮想関数の隠蔽など）を警告で教えてくれます。警告レベルを上げ、警告ゼロの状態を維持するのがベストプラクティスです。",
    task: "（この問題は概念的です）派生クラスで仮想関数をオーバーライドしようとして、シグネチャが微妙に異なっているために「基底クラスの関数を隠している」という警告が出る状況を、`override` キーワード（C++11以降）を明示的に使用して修正してください。",
    initialCode: `#include <iostream>

class Base {
public:
    virtual void mf1(int x) { std::cout << "Base::mf1" << std::endl; }
};

class Derived : public Base {
public:
    // --- TODO: 意図した通りにオーバーライドするように修正してください ---
    // シグネチャが Base と異なると警告や隠蔽が発生します
    virtual void mf1(double x) { std::cout << "Derived::mf1" << std::endl; }
};

int main() {
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "基底クラスの仮想関数をオーバーライドする際は、シグネチャ（引数の型）を完全に一致させる必要があります。不一致があると「隠蔽」が発生します。C++11以降の `override` を使うのが安全です。",
    solution: `class Derived : public Base {
public:
    virtual void mf1(int x) override { 
        std::cout << "Derived::mf1" << std::endl; 
    }
};`,
    clientValidation: (code: string) => {
      if (!code.includes("mf1(int") || !code.includes("override")) {
          return "テスト失敗: 引数の型を `int` に合わせ、`override` 指定子を付けて意図を明確にしてください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-54",
    category: "Effective C++",
    title: "54. Effective C++ 項54 (Item 54)",
    description: "項54: 標準ライブラリ (TR1 を含む) や Boost に慣れ親しんでください。C++ 標準ライブラリは、コンテナ、アルゴリズム、スマートポインタ、正規表現、関数オブジェクトなど、幅広く強力なツールを提供しており、自分で車輪を再発明する必要がありません。",
    task: "生のポインタやリストを手動で操作する代わりに、`std::shared_ptr` と標準アルゴリズム `std::for_each` (または範囲ベース for) を使用するように書き換えてください。",
    initialCode: `#include <iostream>
#include <vector>
#include <algorithm>
#include <memory>

void process(int x) { std::cout << x << " "; }

int main() {
    std::vector<int*> vec;
    for(int i=0; i<5; ++i) vec.push_back(new int(i));

    // --- TODO: shared_ptr と標準アルゴリズムを使用してください ---
    for(size_t i=0; i<vec.size(); ++i) {
        process(*vec[i]);
    }

    for(auto p : vec) delete p;
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "手動の `new` と `delete` ループの代わりに、`std::shared_ptr` を使用したコンテナを作成しましょう。また、ループには標準的な方法（アルゴリズムや範囲ベース for）を使用してください。",
    solution: `int main() {
    std::vector<std::shared_ptr<int>> vec;
    for(int i=0; i<5; ++i) vec.push_back(std::make_shared<int>(i));

    for(const auto& p : vec) {
        process(*p);
    }
    return 0;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("std::shared_ptr") || code.includes("delete p")) {
          return "テスト失敗: リソース管理には `std::shared_ptr` を、ループには標準的な方法（アルゴリズムや範囲ベース for）を使用し、手動の delete を避けてください。";
      }
      return null;
    }
  },
  {
    id: "effective-cpp-item-55",
    category: "Effective C++",
    title: "55. Effective C++ 項55 (Item 55)",
    description: "項55: Boost に注目してください。Boost は C++ コミュニティによって開発されている高品質なライブラリ群であり、その多くが後の C++ 標準に採用されています。言語の限界を押し広げるような高度な機能も多く含まれています。",
    task: "（概念的な問題）Boost の `noncopyable` クラスを継承することで、クラスのコピーを禁止する手法を、第6項の手法を使わずに表現してください（擬似コードでも可）。",
    initialCode: `#include <iostream>

// --- TODO: Boost のような noncopyable を自作して継承させてください ---
class MySecretData {
public:
    MySecretData(int d) : data(d) {}
private:
    int data;
};

int main() {
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "「コピー禁止」を表現するための基底クラス（例：`noncopyable` や `Uncopyable`）を作成し、そのコピーコンストラクタとコピー代入演算子を `= delete` （または private で宣言）します。その後、`MySecretData` でそのクラスを継承します。",
    solution: `class noncopyable {
protected:
    noncopyable() {}
    ~noncopyable() {}
private:
    noncopyable(const noncopyable&) = delete;
    noncopyable& operator=(const noncopyable&) = delete;
};

class MySecretData : private noncopyable {
public:
    MySecretData(int d) : data(d) {}
private:
    int data;
};`,
    clientValidation: (code: string) => {
      const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
      
      const hasBase = /class\s+(noncopyable|Uncopyable)/.test(cleanCode);
      if (!hasBase) {
          return "テスト失敗: `noncopyable` または `Uncopyable` という名前のクラスを作成してください。";
      }

      const inherits = /class\s+MySecretData\s*:\s*(public|protected|private)?\s*(noncopyable|Uncopyable)/.test(cleanCode);
      if (!inherits) {
          return "テスト失敗: `MySecretData` が `noncopyable` または `Uncopyable` を継承するようにしてください。";
      }

      const copyDisabled = cleanCode.includes("= delete") || 
                           /private:[\s\S]*?(noncopyable|Uncopyable)\s*\(\s*const\s+\1\s*&\s*\)/.test(cleanCode) ||
                           /private:[\s\S]*?operator\s*=\s*\(\s*const\s+\w+\s*&\s*\)/.test(cleanCode);
      
      if (!copyDisabled) {
          return "テスト失敗: `noncopyable` クラスのコピー機能を禁止してください（`= delete` または `private` での宣言）。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-hello-world",
    category: "C++の基礎",
    title: "1. 標準出力 (Hello World)",
    description: "プログラミングの第一歩は、画面に文字を表示することです。C++では `std::cout` を使用して標準出力にテキストを送ります。",
    task: "標準出力に 'Hello, C++ World!' と出力するプログラムを完成させてください。最後には改行（`std::endl`）を付けてください。",
    initialCode: `#include <iostream>

int main() {
    // --- TODO: 'Hello, C++ World!' と出力してください ---
    
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::stringstream buffer;
    std::streambuf* old = std::cout.rdbuf(buffer.rdbuf());
    
    // ユーザーのコードは main を user_main に置換して実行される想定
    // ここでは直接 main の中身をテストする
    std::cout << "Hello, C++ World!" << std::endl;
    
    std::cout.rdbuf(old);
    std::string output = buffer.str();
    
    // 実際にはユーザーのプログラムを実行した結果を判定する
    // このテストコードは、実行環境の都合で「期待される出力」を出すだけのダミーに近い
    // アプリ側のロジックで実際の出力をキャプチャして判定する
    std::cout << "TEST_PASSED" << std::endl; 
    return 0;
}
`,
    hint: "`std::cout << \"表示したい文字列\" << std::endl;` と記述します。",
    solution: `int main() {
    std::cout << "Hello, C++ World!" << std::endl;
    return 0;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("Hello, C++ World!")) {
        return "テスト失敗: 'Hello, C++ World!' という文字列を出力する必要があります。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-variables",
    category: "C++の基礎",
    title: "2. 変数とデータ型",
    description: "プログラムでは値を保存するために変数を使用します。代表的な型には `int`（整数）、`double`（浮動小数点数）、`char`（文字）などがあります。",
    task: "整数型の変数 `age` を宣言して `25` を代入し、その値を出力してください。出力形式は 'Age: 25' としてください。",
    initialCode: `#include <iostream>

int main() {
    // --- TODO: 変数 age を宣言・初期化し、出力してください ---
    
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <sstream>

int main() {
    // クライアントバリデーションで十分ですが、一応
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "`int age = 25;` のように宣言し、`std::cout << \"Age: \" << age << std::endl;` で出力します。",
    solution: `int main() {
    int age = 25;
    std::cout << "Age: " << age << std::endl;
    return 0;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("int age") || !code.includes("25")) {
        return "テスト失敗: int 型の変数 age に 25 を代入する必要があります。";
      }
      if (!code.includes("Age: ")) {
        return "テスト失敗: 'Age: ' というラベルを付けて出力してください。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-arithmetic",
    category: "C++の基礎",
    title: "3. 算術演算子",
    description: "C++では `+`, `-`, `*`, `/` などの記号を使って計算を行います。また、`%` は割り算の余り（剰余）を求めます。",
    task: "2つの整数 `a = 10` と `b = 3` があります。`a` を `b` で割った時の「商」と「余り」を計算して出力してください。\n出力形式:\nQuotient: 3\nRemainder: 1",
    initialCode: `#include <iostream>

int main() {
    int a = 10;
    int b = 3;
    // --- TODO: 商と余りを計算して出力してください ---
    
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "商は `a / b`、余りは `a % b` で求められます。",
    solution: `int main() {
    int a = 10;
    int b = 3;
    std::cout << "Quotient: " << a / b << std::endl;
    std::cout << "Remainder: " << a % b << std::endl;
    return 0;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("/") || !code.includes("%")) {
        return "テスト失敗: 除算(`/`)と剰余演算(`%`)の両方を使用してください。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-if-else",
    category: "C++の基礎",
    title: "4. 条件分岐 (if-else)",
    description: "`if` 文を使用すると、条件に応じてプログラムの動きを変えることができます。",
    task: "変数 `score` の値が `60` 以上なら 'Passed'、そうでなければ 'Failed' と出力してください。",
    initialCode: `#include <iostream>

int main() {
    int score = 75;
    // --- TODO: score に応じて判定を出力してください ---
    
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "if (score >= 60) { ... } else { ... } という構造になります。",
    solution: `int main() {
    int score = 75;
    if (score >= 60) {
        std::cout << "Passed" << std::endl;
    } else {
        std::cout << "Failed" << std::endl;
    }
    return 0;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("if") || !code.includes("else")) {
        return "テスト失敗: if-else 文を使用して判定を行ってください。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-logical",
    category: "C++の基礎",
    title: "5. 論理演算子",
    description: "複数の条件を組み合わせるには論理演算子を使用します。`&&` (かつ)、`||` (または)、`!` (否定) があります。",
    task: "年齢 `age` が `13` 以上 かつ `19` 以下である場合に 'Teenager' と出力し、そうでなければ 'Not a teenager' と出力してください。",
    initialCode: `#include <iostream>

int main() {
    int age = 15;
    // --- TODO: age が 13〜19 の範囲内か判定してください ---
    
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "`if (age >= 13 && age <= 19)` のように `&&` を使用します。",
    solution: `int main() {
    int age = 15;
    if (age >= 13 && age <= 19) {
        std::cout << "Teenager" << std::endl;
    } else {
        std::cout << "Not a teenager" << std::endl;
    }
    return 0;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("&&")) {
        return "テスト失敗: 論理積 `&&` を使用して範囲を判定してください。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-for-loop",
    category: "C++の基礎",
    title: "6. for ループ",
    description: "`for` ループは、決まった回数だけ処理を繰り返す場合に適しています。",
    task: "0 から `n` までの整数の合計を計算して出力するプログラムを作成してください。`n = 10` とします。",
    initialCode: `#include <iostream>

int main() {
    int n = 10;
    int sum = 0;
    // --- TODO: for ループを使って 0 から n までの合計を計算してください ---
    
    std::cout << "Sum: " << sum << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "`for (int i = 0; i <= n; ++i) { sum += i; }` のように記述します。",
    solution: `int main() {
    int n = 10;
    int sum = 0;
    for (int i = 0; i <= n; ++i) {
        sum += i;
    }
    std::cout << "Sum: " << sum << std::endl;
    return 0;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("for")) {
        return "テスト失敗: for ループを使用してください。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-while-loop",
    category: "C++の基礎",
    title: "7. while ループ",
    description: "`while` ループは、特定の条件が満たされている間、処理を繰り返します。",
    task: "`while` ループを使用して、数値 `x` が `100` を超えるまで `2` 倍し続け、その最終的な値を出力してください。初期値は `x = 1` とします。",
    initialCode: `#include <iostream>

int main() {
    int x = 1;
    // --- TODO: while ループを使って x が 100 を超えるまで 2 倍にしてください ---
    
    std::cout << "Final x: " << x << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "`while (x <= 100) { x *= 2; }` のように記述します。",
    solution: `int main() {
    int x = 1;
    while (x <= 100) {
        x *= 2;
    }
    std::cout << "Final x: " << x << std::endl;
    return 0;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("while")) {
        return "テスト失敗: while ループを使用してください。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-functions",
    category: "C++の基礎",
    title: "8. 関数の基礎",
    description: "関数を使用すると、特定の処理に名前を付けて再利用可能な部品にすることができます。",
    task: "2つの整数を受け取り、そのうち大きい方の値を返す `max` 関数を定義して呼び出してください。",
    initialCode: `#include <iostream>

// --- TODO: max 関数をここに定義してください ---

int main() {
    int result = max(15, 20);
    std::cout << "Max: " << result << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "`int max(int a, int b) { if (a > b) return a; else return b; }` のように定義します。",
    solution: `int max(int a, int b) {
    return (a > b) ? a : b;
}

int main() {
    int result = max(15, 20);
    std::cout << "Max: " << result << std::endl;
    return 0;
}`,
    clientValidation: (code: string) => {
      if (!code.match(/int\s+max\s*\(\s*int\s+\w+\s*,\s*int\s+\w+\s*\)/)) {
        return "テスト失敗: 適切な引数と戻り値を持つ max 関数を定義してください。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-arrays",
    category: "C++の基礎",
    title: "9. 配列 (C言語形式)",
    description: "配列は同じ型のデータを連続してメモリに並べたものです。",
    task: "サイズ 5 の整数配列 `numbers` を宣言し、`10, 20, 30, 40, 50` で初期化してください。その後、3番目の要素（インデックス 2）を `100` に書き換えて出力してください。",
    initialCode: `#include <iostream>

int main() {
    // --- TODO: 配列を宣言・初期化し、値を書き換えて出力してください ---
    
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "`int numbers[5] = {10, 20, 30, 40, 50};`、アクセスは `numbers[2] = 100;` です。",
    solution: `int main() {
    int numbers[5] = {10, 20, 30, 40, 50};
    numbers[2] = 100;
    std::cout << "Element 2: " << numbers[2] << std::endl;
    return 0;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("[5]") || !code.includes("[2]")) {
        return "テスト失敗: 配列の宣言とインデックス指定によるアクセスを行ってください。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-string",
    category: "C++の基礎",
    title: "10. 文字列 (std::string)",
    description: "`std::string` は文字列を扱うための便利なクラスです。C言語の `char*` よりも安全で多機能です。",
    task: "2つの文字列 `firstName = \"Bjarne\"` と `lastName = \"Stroustrup\"` を連結し、フルネームを表示してください。間に空白を入れてください。",
    initialCode: `#include <iostream>
#include <string>

int main() {
    std::string firstName = "Bjarne";
    std::string lastName = "Stroustrup";
    // --- TODO: 文字列を連結して出力してください ---
    
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <string>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "`std::string fullName = firstName + \" \" + lastName;` のように `+` 演算子で連結できます。",
    solution: `int main() {
    std::string firstName = "Bjarne";
    std::string lastName = "Stroustrup";
    std::string fullName = firstName + " " + lastName;
    std::cout << "Full Name: " << fullName << std::endl;
    return 0;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("+")) {
        return "テスト失敗: `+` 演算子を使用して文字列を連結してください。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-struct",
    category: "C++の基礎",
    title: "11. 構造体 (struct)",
    description: "構造体は、異なる型のデータをまとめて一つの単位として扱うための機能です。",
    task: "名前（`string`）と年齢（`int`）をメンバに持つ構造体 `Person` を定義し、`\"Alice\"`, `20` で初期化した変数を一つ作成して出力してください。",
    initialCode: `#include <iostream>
#include <string>

// --- TODO: Person 構造体を定義してください ---

int main() {
    // --- TODO: Person のインスタンスを作成し、出力してください ---
    
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "`struct Person { std::string name; int age; };` のように定義します。",
    solution: `struct Person {
    std::string name;
    int age;
};

int main() {
    Person p = {"Alice", 20};
    std::cout << p.name << " (" << p.age << ")" << std::endl;
    return 0;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("struct Person")) {
        return "テスト失敗: Person 構造体を定義してください。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-enum",
    category: "C++の基礎",
    title: "12. 列挙型 (enum class)",
    description: "`enum class` は、関連する定数の集合を定義するための安全な方法です。",
    task: "`Red`, `Green`, `Blue` の 3 つの状態を持つ列挙型 `Color` を定義してください。また、`Color::Green` の場合に 'Green selected' と出力する if 文を実装してください。",
    initialCode: `#include <iostream>

// --- TODO: Color 列挙型を定義してください ---

int main() {
    Color myColor = Color::Green;
    // --- TODO: myColor が Green かどうか判定して出力してください ---
    
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "`enum class Color { Red, Green, Blue };` を使用します。比較は `if (myColor == Color::Green)` です。",
    solution: `enum class Color { Red, Green, Blue };

int main() {
    Color myColor = Color::Green;
    if (myColor == Color::Green) {
        std::cout << "Green selected" << std::endl;
    }
    return 0;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("enum class")) {
        return "テスト失敗: `enum class` を使用して Color を定義してください。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-const",
    category: "C++の基礎",
    title: "13. 定数 (const)",
    description: "`const` キーワードを付けると、その変数の値が変更されるのを防ぐことができます。意図しない書き換えによるバグを減らせます。",
    task: "定数 `PI` を `3.14159` として宣言し、半径 `radius = 5.0` の円の面積を計算して出力してください。面積は `PI * radius * radius` です。",
    initialCode: `#include <iostream>

int main() {
    double radius = 5.0;
    // --- TODO: PI を定数として宣言し、面積を出力してください ---
    
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "`const double PI = 3.14159;` と記述します。",
    solution: `int main() {
    const double PI = 3.14159;
    double radius = 5.0;
    std::cout << "Area: " << PI * radius * radius << std::endl;
    return 0;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("const")) {
        return "テスト失敗: `const` キーワードを使用してください。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-scope",
    category: "C++の基礎",
    title: "14. スコープ",
    description: "変数には「有効範囲（スコープ）」があります。ブロック `{}` の中で宣言された変数は、その外側からはアクセスできません。",
    task: "以下のコードを修正して、グローバル変数 `x` とローカル変数 `x` の区別を確認してください。ローカル変数の `x` を出力した後、スコープ解決演算子 `::` を使ってグローバルな `x` も出力してください。",
    initialCode: `#include <iostream>

int x = 100; // グローバル変数

int main() {
    int x = 10; // ローカル変数
    // --- TODO: ローカルの x と グローバルの x をそれぞれ出力してください ---
    
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "`std::cout << x;` でローカル、`std::cout << ::x;` でグローバルな変数にアクセスできます。",
    solution: `int x = 100;
int main() {
    int x = 10;
    std::cout << "Local x: " << x << std::endl;
    std::cout << "Global x: " << ::x << std::endl;
    return 0;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("::x")) {
        return "テスト失敗: スコープ解決演算子 `::` を使用してグローバル変数にアクセスしてください。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-pointers",
    category: "C++の基礎",
    title: "15. ポインタの基礎",
    description: "ポインタは、他の変数のメモリアドレスを保持する変数です。値そのものではなく、値がどこにあるかを指し示します。",
    task: "整数 `val = 42` に対するポインタ `p` を作成し、そのポインタを経由して `val` の値を `100` に書き換えてください。",
    initialCode: `#include <iostream>

int main() {
    int val = 42;
    // --- TODO: val を指すポインタ p を作成し、値を 100 に書き換えてください ---
    
    std::cout << "Value: " << val << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>
int main() {
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "`int* p = &val;` でアドレスを取得し、`*p = 100;` で間接的に値を書き換えます。",
    solution: `int main() {
    int val = 42;
    int* p = &val;
    *p = 100;
    std::cout << "Value: " << val << std::endl;
    return 0;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("*") || !code.includes("&")) {
        return "テスト失敗: ポインタ（`*`）とアドレス演算子（`&`）を使用してください。";
      }
      return null;
    }
  },
  {
    id: "static-polymorphism",
    category: "C++の基礎",
    title: "16. 静的ポリモーフィズム (Static Polymorphism)",
    description: "静的ポリモーフィズム（またはコンパイル時ポリモーフィズム）は、主に関数のオーバーロードやテンプレートによって実現されます。コンパイル時にどの関数が呼び出されるかが決定されます。",
    task: "引数の型に応じて動作を変える `printValue` 関数をオーバーロードして実装してください。\n1. `int` 型を受け取り 'Integer: <value>' と出力する。\n2. `double` 型を受け取り 'Double: <value>' と出力する。\n3. `std::string` 型を受け取り 'String: <value>' と出力する。",
    initialCode: `#include <iostream>
#include <string>

// --- TODO: printValue 関数をオーバーロードして実装してください ---

int main() {
    printValue(10);
    printValue(3.14);
    printValue(std::string("Hello"));
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::stringstream buffer;
    std::streambuf* old = std::cout.rdbuf(buffer.rdbuf());
    
    printValue(42);
    printValue(2.71);
    printValue(std::string("C++"));
    
    std::cout.rdbuf(old);
    std::string output = buffer.str();
    
    if (output.find("Integer: 42") != std::string::npos &&
        output.find("Double: 2.71") != std::string::npos &&
        output.find("String: C++") != std::string::npos) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    } else {
        std::cout << "TEST_FAILED: 出力が期待通りではありません。" << std::endl;
        return 1;
    }
}
`,
    hint: "関数の名前は同じ `printValue` にし、引数の型だけを変えて3つの関数を定義します。例：`void printValue(int v) { ... }`",
    solution: `void printValue(int v) {
    std::cout << "Integer: " << v << std::endl;
}

void printValue(double v) {
    std::cout << "Double: " << v << std::endl;
}

void printValue(std::string v) {
    std::cout << "String: " << v << std::endl;
}`,
    clientValidation: (code: string) => {
      const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
      const matches = cleanCode.match(/void\s+printValue/g);
      if (!matches || matches.length < 3) {
        return "テスト失敗: printValue 関数を少なくとも3つオーバーロードする必要があります。";
      }
      return null;
    }
  },
  {
    id: "dynamic-polymorphism",
    category: "C++の基礎",
    title: "17. 動的ポリモーフィズム (Dynamic Polymorphism)",
    description: "動的ポリモーフィズム（または実行時ポリモーフィズム）は、継承と仮想関数（virtual functions）を使用して実現されます。実行時にオブジェクトの実際の型に基づいて呼び出される関数が決定されます。",
    task: "以下の設計に従ってクラスを実装してください。\n1. 抽象基底クラス `Shape` を作成し、純粋仮想関数 `void draw() const` を定義する。\n2. `Shape` を継承した `Circle` クラスを作成し、`draw()` で 'Drawing Circle' と出力する。\n3. `Shape` を継承した `Square` クラスを作成し、`draw()` で 'Drawing Square' と出力する。\n4. `main` 関数で `Shape` ポインタの配列（または `std::vector`）を使用して、それぞれの `draw()` を呼び出す。",
    initialCode: `#include <iostream>
#include <vector>
#include <memory>

// --- TODO: Shape, Circle, Square クラスを実装してください ---

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle>());
    shapes.push_back(std::make_unique<Square>());

    for (const auto& shape : shapes) {
        shape->draw();
    }
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <sstream>
#include <vector>
#include <memory>

int main() {
    std::stringstream buffer;
    std::streambuf* old = std::cout.rdbuf(buffer.rdbuf());
    
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle>());
    shapes.push_back(std::make_unique<Square>());

    for (const auto& shape : shapes) {
        shape->draw();
    }
    
    std::cout.rdbuf(old);
    std::string output = buffer.str();
    
    if (output.find("Drawing Circle") != std::string::npos &&
        output.find("Drawing Square") != std::string::npos) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    } else {
        std::cout << "TEST_FAILED: 正しく描画されませんでした。仮想関数が正しくオーバーライドされているか確認してください。" << std::endl;
        return 1;
    }
}
`,
    hint: "1. `class Shape { public: virtual void draw() const = 0; virtual ~Shape() {} };` のように基底クラスを定義します。\n2. 派生クラスでは `void draw() const override { ... }` を使用して実装します。",
    solution: `class Shape {
public:
    virtual ~Shape() {}
    virtual void draw() const = 0;
};

class Circle : public Shape {
public:
    void draw() const override {
        std::cout << "Drawing Circle" << std::endl;
    }
};

class Square : public Shape {
public:
    void draw() const override {
        std::cout << "Drawing Square" << std::endl;
    }
};`,
    clientValidation: (code: string) => {
      const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
      if (!cleanCode.includes("virtual") || !cleanCode.includes("Shape") || !cleanCode.includes("Circle") || !cleanCode.includes("Square")) {
        return "テスト失敗: 仮想関数と継承を使用して Shape, Circle, Square クラスを実装する必要があります。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-references",
    category: "C++の基礎",
    title: "18. 参照渡し (References)",
    description: "C++の参照（references）は、既存の変数の別名として機能します。ポインタと同様に、関数内で元の変数を変更するために使用されますが、構文がより簡潔で安全です。",
    task: "2つの整数を入れ替える `swapValues` 関数を参照渡しを使用して実装してください。`int*`（ポインタ）ではなく `int&`（参照）を使用してください。",
    initialCode: `#include <iostream>

// --- TODO: 参照渡しを使用して swapValues を実装してください ---

int main() {
    int a = 10;
    int b = 20;
    std::cout << "Before: a = " << a << ", b = " << b << std::endl;
    swapValues(a, b);
    std::cout << "After: a = " << a << ", b = " << b << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>

int main() {
    int x = 100;
    int y = 500;
    swapValues(x, y);
    if (x == 500 && y == 100) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    } else {
        std::cout << "TEST_FAILED: 前後の値が正しく入れ替わっていません。" << std::endl;
        return 1;
    }
}
`,
    hint: "関数の型宣言は `void swapValues(int& x, int& y)` となります。関数内部では、通常の変数と同様に扱うことができます。",
    solution: `void swapValues(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}`,
    clientValidation: (code: string) => {
      const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
      if (!cleanCode.match(/void\s+swapValues\s*\(\s*int\s*&\s*\w+\s*,\s*int\s*&\s*\w+\s*\)/)) {
        return "テスト失敗: `swapValues` 関数は `int&`（参照）を引数に取る必要があります。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-vector",
    category: "C++の基礎",
    title: "19. STL Vector",
    description: "std::vector は C++ 標準ライブラリ (STL) の動的配列コンテナです。実行時にサイズを自由に変更でき、メモリ管理も自動的に行われます。",
    task: "与えられた整数のベクター `v` に `1` から `5` までの整数を追加し、その合計を返す `calculateSum` 関数を完成させてください。",
    initialCode: `#include <iostream>
#include <vector>

int calculateSum() {
    std::vector<int> v;
    // --- TODO: v に 1, 2, 3, 4, 5 を追加し、その合計を計算して返してください ---
    
    return 0; // 仮の戻り値
}

int main() {
    std::cout << "Sum: " << calculateSum() << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>

int main() {
    if (calculateSum() == 15) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    } else {
        std::cout << "TEST_FAILED: 合計値が正しくありません（期待値: 15）。" << std::endl;
        return 1;
    }
}
`,
    hint: "`v.push_back(value)` で要素を追加し、範囲ベースの for 文（`for (int n : v)`）などで合計を計算します。",
    solution: `int calculateSum() {
    std::vector<int> v;
    for (int i = 1; i <= 5; ++i) {
        v.push_back(i);
    }
    int sum = 0;
    for (int n : v) {
        sum += n;
    }
    return sum;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("push_back")) {
        return "テスト失敗: `push_back` を使用して要素を追加してください。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-unique-ptr",
    category: "C++の基礎",
    title: "20. スマートポインタ (unique_ptr)",
    description: "C++11 以降、生のポインタ（raw pointers）の代わりにスマートポインタを使用することが推奨されています。`std::unique_ptr` はオブジェクトの排他的な所有権を保持し、スコープを抜ける際に自動的にメモリを解放します。",
    task: "`new` と `delete` を直接使用する代わりに、`std::make_unique` を使用して動的にメモリを確保するようにコードを書き換えてください。`SimpleObject` クラスのポインタを `std::unique_ptr` で管理してください。",
    initialCode: `#include <iostream>
#include <memory>
#include <string>

class SimpleObject {
public:
    SimpleObject(std::string name) : name(name) {
        std::cout << name << " created" << std::endl;
    }
    ~SimpleObject() {
        std::cout << name << " destroyed" << std::endl;
    }
    void greet() const {
        std::cout << "Hello from " << name << std::endl;
    }
private:
    std::string name;
};

void runDemo() {
    // --- TODO: std::unique_ptr と std::make_unique を使用するように書き換えてください ---
    SimpleObject* obj = new SimpleObject("Owner");
    obj->greet();
    delete obj;
}

int main() {
    runDemo();
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <memory>
#include <string>
#include <sstream>

int main() {
    std::stringstream buffer;
    std::streambuf* old = std::cout.rdbuf(buffer.rdbuf());
    
    runDemo();
    
    std::cout.rdbuf(old);
    std::string output = buffer.str();
    
    if (output.find("Owner created") != std::string::npos &&
        output.find("Owner destroyed") != std::string::npos) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    } else {
        std::cout << "TEST_FAILED: オブジェクトの生成または破棄が正しく行われませんでした。" << std::endl;
        return 1;
    }
}
`,
    hint: "1. `delete obj;` を削除します。 2. `obj` の定義を `auto obj = std::make_unique<SimpleObject>(\"Owner\");` に変更します。",
    solution: `void runDemo() {
    auto obj = std::make_unique<SimpleObject>("Owner");
    obj->greet();
}`,
    clientValidation: (code: string) => {
      const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
      if (cleanCode.includes("delete") && cleanCode.includes("obj")) {
        return "テスト失敗: 手動で `delete` を呼び出してはいけません。`std::unique_ptr` に管理を任せてください。";
      }
      if (!cleanCode.includes("unique_ptr") && !cleanCode.includes("make_unique")) {
        return "テスト失敗: `std::unique_ptr` または `std::make_unique` を使用してください。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-lambda",
    category: "C++の基礎",
    title: "21. ラムダ式 (Lambda Expressions)",
    description: "ラムダ式は、関数オブジェクトを名前を付けずに定義できる機能です。アルゴリズム（例：std::sort）の比較関数や、コールバック関数の記述に非常に便利です。",
    task: "構造体 `Item` のベクターを、その `price` の昇順にソートしてください。`std::sort` の第3引数としてラムダ式を渡してください。",
    initialCode: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

struct Item {
    std::string name;
    int price;
};

void sortItems(std::vector<Item>& items) {
    // --- TODO: items を price の昇順（小さい順）にソートしてください ---
    // std::sort(items.begin(), items.end(), ...);
}

int main() {
    std::vector<Item> items = {{"Orange", 100}, {"Apple", 50}, {"Banana", 80}};
    sortItems(items);
    for (const auto& item : items) {
        std::cout << item.name << ": " << item.price << std::endl;
    }
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<Item> items = {{"C", 30}, {"A", 10}, {"B", 20}};
    sortItems(items);
    if (items[0].price == 10 && items[1].price == 20 && items[2].price == 30) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    } else {
        std::cout << "TEST_FAILED: 価格順にソートされていません。" << std::endl;
        return 1;
    }
}
`,
    hint: "ラムダ式の基本形は `[](const Item& a, const Item& b) { return a.price < b.price; }` です。",
    solution: `void sortItems(std::vector<Item>& items) {
    std::sort(items.begin(), items.end(), [](const Item& a, const Item& b) {
        return a.price < b.price;
    });
}`,
    clientValidation: (code: string) => {
      if (!code.includes("[]")) {
        return "テスト失敗: ラムダ式 `[]` を使用してソート条件を指定してください。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-templates",
    category: "C++の基礎",
    title: "22. 関数テンプレート (Function Templates)",
    description: "テンプレートは、データ型をパラメータ化して抽象化するための機能です。同じロジックを異なるデータ型（int, double, カスタムクラスなど）に対して再利用することができます。",
    task: "2つの引数を受け取り、その合計を返す `add` 関数をテンプレートで実装してください。`int` と `double` の両方のケースで動作するようにします。",
    initialCode: `#include <iostream>
#include <string>

// --- TODO: 関数テンプレート add を実装してください ---

int main() {
    std::cout << "Int: " << add(5, 3) << std::endl;
    std::cout << "Double: " << add(2.5, 1.5) << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>

int main() {
    if (add(10, 20) == 30 && add(1.5, 2.5) == 4.0) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    } else {
        std::cout << "TEST_FAILED: 合計値が正しくありません。" << std::endl;
        return 1;
    }
}
`,
    hint: "`template <typename T>` を使用して関数を定義します。戻り値の型も `T` になります。",
    solution: `template <typename T>
T add(T a, T b) {
    return a + b;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("template") || !code.includes("<typename")) {
        return "テスト失敗: `template <typename T>` を使用してテンプレート関数を定義してください。";
      }
      return null;
    }
  },
  {
    id: "cpp-basics-class",
    category: "C++の基礎",
    title: "23. クラスの基本 (Class Basics)",
    description: "C++のクラスは、データ（メンバ変数）と操作（メンバ関数）を一つにまとめるカプセル化（Encapsulation）を提供します。`private` メンバを使用してデータへの直接アクセスを制限するのが基本です。",
    task: "銀行口座を表す `BankAccount` クラスを完成させてください。\n1. `balance`（残高）を `private` メンバ変数として持ち、初期値をコンストラクタで設定する。\n2. `deposit(int amount)` メソッドで残高を増やす。\n3. `getBalance()` メソッド（const メンバ関数）で現在の残高を返す。",
    initialCode: `#include <iostream>

class BankAccount {
public:
    // --- TODO: コンストラクタとメンバ関数を実装してください ---

private:
    // --- TODO: メンバ変数を定義してください ---
};

int main() {
    BankAccount account(1000);
    account.deposit(500);
    std::cout << "Balance: " << account.getBalance() << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>

int main() {
    BankAccount acc(500);
    acc.deposit(300);
    if (acc.getBalance() == 800) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    } else {
        std::cout << "TEST_FAILED: 残高が正しく更新されていない、または取得できませんでした。" << std::endl;
        return 1;
    }
}
`,
    hint: "コンストラクタはクラス名と同じ名前の関数です。`balance` を `private:` セクションに配置し、`getBalance` には `const` を付けて状態を変更しないことを示します。",
    solution: `class BankAccount {
public:
    BankAccount(int initialBalance) : balance(initialBalance) {}
    
    void deposit(int amount) {
        balance += amount;
    }
    
    int getBalance() const {
        return balance;
    }

private:
    int balance;
};`,
    clientValidation: (code: string) => {
      const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
      if (!cleanCode.includes("private") || !cleanCode.includes("balance")) {
        return "テスト失敗: `balance` は `private` 変数である必要があります。";
      }
      if (!cleanCode.match(/int\s+getBalance\(\)\s+const/)) {
        return "テスト失敗: `getBalance` メソッドは `const` メンバ関数にする必要があります。";
      }
      return null;
    }
  },
  {
    id: "srp-refactoring",
    category: "Refactoring",
    title: "24. 単一責任の原則 (SRP)",
    description: "`UserAccount` クラスは現在、「ユーザー情報の保持」と「ファイルへの保存」の 2 つの責任を持っています。",
    task: "「ファイル保存」のロジックを `FileSaver` クラスに分離してください。",
    initialCode: `#include <iostream>
#include <string>
#include <fstream>

class UserAccount {
public:
    UserAccount(std::string name, std::string email) : name(name), email(email) {}
    std::string getName() const { return name; }
    std::string getEmail() const { return email; }
    void saveToFile(const std::string& filename) {
        std::ofstream file(filename);
        file << "Name: " << name << "\\nEmail: " << email << std::endl;
        file.close();
    }
private:
    std::string name;
    std::string email;
};

int main() {
    return 0;
}
`,
    testCode: `#include <iostream>\nint main() { std::cout << "TEST_PASSED" << std::endl; return 0; }`,
    hint: "FileSaver クラスを作成して保存ロジックを移動します。",
    solution: `class FileSaver { public: void save(const UserAccount& u, const std::string& f) { /* ... */ } };`,
    clientValidation: (code: string) => {
      if (!code.includes("class FileSaver")) return "テスト失敗: FileSaver クラスを作成してください。";
      return null;
    }
  },
  {
    id: "dip-interfaces",
    category: "Design Patterns",
    title: "25. 依存性逆転の原則 (DIP)",
    description: "Switch クラスが具象クラスに依存しています。",
    task: "Switchable インターフェースを導入してください。",
    initialCode: `#include <iostream>
class LightBulb { public: void turnOn(){} void turnOff(){} };
class Switch {
public:
    Switch(LightBulb& b) : bulb(b) {}
    void operate(bool on) { if(on) bulb.turnOn(); else bulb.turnOff(); }
private:
    LightBulb& bulb;
};
int main() { return 0; }
`,
    testCode: `#include <iostream>\nint main() { std::cout << "TEST_PASSED" << std::endl; return 0; }`,
    hint: "Switchable インターフェースを継承させます。",
    solution: `class Switchable { public: virtual void turnOn()=0; virtual void turnOff()=0; };`,
    clientValidation: (code: string) => {
      if (!code.includes("Switchable")) return "テスト失敗: Switchable インターフェースを使用してください。";
      return null;
    }
  },
  {
    id: "factory-method",
    category: "Design Patterns",
    title: "26. Factory Method パターン",
    description: "生成の責任をサブクラスに委譲します。",
    task: "TextApplication で TextDocument を生成するように実装してください。",
    initialCode: `#include <iostream>
class Document { public: virtual ~Document(){} };
class TextDocument : public Document {};
class Application {
public:
    virtual Document* createDocument() = 0;
};
int main() { return 0; }
`,
    testCode: `#include <iostream>\nint main() { std::cout << "TEST_PASSED" << std::endl; return 0; }`,
    hint: "createDocument をオーバーライドします。",
    solution: `class TextApplication : public Application { public: Document* createDocument() override { return new TextDocument(); } };`,
    clientValidation: (code: string) => {
      if (!code.includes("TextApplication")) return "テスト失敗: TextApplication を実装してください。";
      return null;
    }
  },
  {
    id: "observer-pattern",
    category: "Design Patterns",
    title: "27. Observer パターン",
    description: "状態変化を通知します。",
    task: "Subject に通知メカニズムを実装してください。",
    initialCode: `#include <iostream>
#include <vector>
class Observer { public: virtual void update(int v) = 0; };
class Subject {
public:
    void attach(Observer* o) {}
    void notify(int v) {}
private:
    std::vector<Observer*> observers;
};
int main() { return 0; }
`,
    testCode: `#include <iostream>\nint main() { std::cout << "TEST_PASSED" << std::endl; return 0; }`,
    hint: "ループで update を呼び出します。",
    solution: `void notify(int v) { for(auto o : observers) o->update(v); }`,
    clientValidation: (code: string) => {
      if (!code.includes("update")) return "テスト失敗: update を呼び出してください。";
      return null;
    }
  },
  {
    id: "decorator-pattern",
    category: "Design Patterns",
    title: "28. Decorator パターン",
    description: "動的に機能を追加します。",
    task: "Milk デコレータを実装してください。",
    initialCode: `#include <iostream>
#include <memory>
class Beverage { public: virtual double cost() = 0; };
class Espresso : public Beverage { public: double cost() override { return 1.99; } };
class Decorator : public Beverage {
protected:
    std::shared_ptr<Beverage> b;
public:
    Decorator(std::shared_ptr<Beverage> b) : b(b) {}
};
int main() { return 0; }
`,
    testCode: `#include <iostream>\nint main() { std::cout << "TEST_PASSED" << std::endl; return 0; }`,
    hint: "Decorator を継承して Milk を作ります。",
    solution: `class Milk : public Decorator { public: Milk(std::shared_ptr<Beverage> b) : Decorator(b){} double cost() override { return b->cost() + 0.1; } };`,
    clientValidation: (code: string) => {
      if (!code.includes("Milk")) return "テスト失敗: Milk を実装してください。";
      return null;
    }
  },
  {
    id: "singleton-pattern",
    category: "Design Patterns",
    title: "29. Singleton パターン",
    description: "唯一のインスタンス。",
    task: "getInstance を実装してください。",
    initialCode: `#include <iostream>
class Database {
public:
    static Database& getInstance() {}
private:
    Database() {}
};
int main() { return 0; }
`,
    testCode: `#include <iostream>\nint main() { std::cout << "TEST_PASSED" << std::endl; return 0; }`,
    hint: "static インスタンスを返します。",
    solution: `static Database& getInstance() { static Database i; return i; }`,
    clientValidation: (code: string) => {
      if (!code.includes("static")) return "テスト失敗: static を使用してください。";
      return null;
    }
  },
  {
    id: "polymorphism-conditional",
    category: "Refactoring",
    title: "30. 条件分岐のポリモーリズム化",
    description: "switch をポリモーリズムへ。",
    task: "calculateBonus を多態性で書き換えてください。",
    initialCode: `#include <iostream>
enum class Type { Eng, Mgr };
class Employee {
public:
    double getBonus(Type t, double s) {
        if(t == Type::Eng) return s * 0.1;
        return s * 0.2;
    }
};
int main() { return 0; }
`,
    testCode: `#include <iostream>\nint main() { std::cout << "TEST_PASSED" << std::endl; return 0; }`,
    hint: "派生クラスで getBonus を実装します。",
    solution: `class Engineer : public Employee { double getBonus(double s) override { return s * 0.1; } };`,
    clientValidation: (code: string) => {
      if (code.includes("enum")) return "テスト失敗: enum を削除してください。";
      return null;
    }
  },
  {
    id: "domain-model",
    category: "Refactoring",
    title: "31. ドメインモデルの導入",
    description: "ロジックをカプセル化。",
    task: "ship メソッドを Order クラスに追加してください。",
    initialCode: `#include <iostream>
class Order { public: int status = 0; };
void ship(Order& o) { if(o.status == 0) o.status = 1; }
int main() { return 0; }
`,
    testCode: `#include <iostream>\nint main() { std::cout << "TEST_PASSED" << std::endl; return 0; }`,
    hint: "status を private にします。",
    solution: `class Order { public: void ship() { if(status == 0) status = 1; } private: int status = 0; };`,
    clientValidation: (code: string) => {
      if (code.includes("public: int status")) return "テスト失敗: status を private にしてください。";
      return null;
    }
  },
  {
    id: "parameter-object",
    category: "Refactoring",
    title: "32. 引数オブジェクトの導入",
    description: "多数の引数を 1 つのオブジェクトにまとめます。",
    task: "`findTransactions` の引数を `TransactionFilter` 構造体にまとめてください。",
    initialCode: `#include <iostream>\n#include <string>\n\nvoid findTransactions(std::string start, std::string end, double min, double max) {}\n\nint main() { return 0; }\n`,
    hint: "struct TransactionFilter を作成し、それを引数に取ります。",
    solution: `struct TransactionFilter { std::string start, end; double min, max; };\nvoid findTransactions(const TransactionFilter& f) {}`,
    testCode: `#include <iostream>\nint main() { std::cout << "TEST_PASSED" << std::endl; return 0; }`,
    clientValidation: (code: string) => {
      if (!code.includes("TransactionFilter")) return "テスト失敗: TransactionFilter を作成してください。";
      return null;
    }
  },
  {
    id: "layered-arch",
    category: "Design Patterns",
    title: "33. レイヤードアーキテクチャ",
    description: "UI とビジネスロジックを分離します。",
    task: "`UserService` を作成し、`main` からロジックを分離してください。",
    initialCode: `#include <iostream>\n#include <string>\n\nclass UserRepository { public: void save(const std::string& u) {} };\n\nint main() { return 0; }\n`,
    hint: "UserService::registerUser を実装します。",
    solution: `class UserService { public: UserService(UserRepository& r) : repo(r) {} void registerUser(std::string n) { if(!n.empty()) repo.save(n); } private: UserRepository& repo; };`,
    testCode: `#include <iostream>\nint main() { std::cout << "TEST_PASSED" << std::endl; return 0; }`,
    clientValidation: (code: string) => {
      if (!code.includes("UserService")) return "テスト失敗: UserService を作成してください。";
      return null;
    }
  },
  {
    id: "error-handling-result",
    category: "Refactoring",
    title: "34. エラーハンドリング設計",
    description: "`std::optional` を使用して、値がないことを安全に表現します。",
    task: "`findUserName` を `std::optional` を返すように修正してください。",
    initialCode: `#include <iostream>\n#include <string>\n#include <map>\n\nstd::map<int, std::string> db = {{1, "Alice"}};\n\nint main() { return 0; }\n`,
    hint: "std::optional<std::string> を返します。",
    solution: `#include <optional>\nstd::optional<std::string> findUserName(int id) { if (db.count(id)) return db[id]; return std::nullopt; }`,
    testCode: `#include <iostream>\n#include <optional>\nint main() { std::cout << "TEST_PASSED" << std::endl; return 0; }`,
    clientValidation: (code: string) => {
      if (!code.includes("optional")) return "テスト失敗: optional を使用してください。";
      return null;
    }
  },
  {
    id: "loose-coupling-events",
    category: "Design Patterns",
    title: "35. 疎結合 (コールバック)",
    description: "`std::function` で処理を注入します。",
    task: "`Button` クラスにクリックハンドラを追加してください。",
    initialCode: `#include <iostream>\n#include <functional>\n\nclass Button { public: void click() {} };\n\nint main() { return 0; }\n`,
    hint: "std::function<void()> onClick を追加します。",
    solution: `class Button { public: void setHandler(std::function<void()> h) { handler = h; } void click() { if(handler) handler(); } private: std::function<void()> handler; };`,
    testCode: `#include <iostream>\nint main() { std::cout << "TEST_PASSED" << std::endl; return 0; }`,
    clientValidation: (code: string) => {
      if (!code.includes("function")) return "テスト失敗: std::function を使用してください。";
      return null;
    }
  },
  {
    id: "game-handle-system",
    category: "Game Programming",
    title: "1. ハンドルによるオブジェクト管理 (Handle System)",
    description: "ゲームエンジンでは、メモリの断片化の回避や、オブジェクトの破棄を安全に扱うために、生のポインタの代わりに「ハンドル（数値ID）」を使用してオブジェクトを管理することがよくあります。これにより、ポインタが指す先のオブジェクトが既に破棄されている（ダングリングポインタ）状態を検知しやすくなります。",
    task: "`Handle` 構造体を受け取って、対応する `Actor` ポインタを返す `resolveHandle(Handle handle)` 関数を実装してください。IDが範囲外の場合は `nullptr` を返してください。",
    initialCode: `#include <iostream>
#include <vector>
#include <string>

struct Actor {
    std::string name;
};

struct Handle {
    unsigned int id;
};

// オブジェクトのプール（本来はもっと複雑ですが、ここでは簡易的なグローバルプールとします）
std::vector<Actor*> actorPool;

// --- TODO: ハンドルからポインタを解決する関数を実装してください ---
Actor* resolveHandle(Handle handle) {
    // ヒント：actorPoolのインデックスを id として扱い、範囲チェックを行ってください
    
}

int main() {
    Actor a1 = {"Player"};
    actorPool.push_back(&a1);
    
    Handle h1 = {0};
    Actor* actor = resolveHandle(h1);
    
    if (actor) {
        std::cout << "Successfully resolved: " << actor->name << std::endl;
    }
    
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <vector>
#include <string>

int main() {
    // 既存のプールをクリア（Wandbox環境では毎回初期化されますが、念のため）
    actorPool.clear();
    
    Actor a1 = {"Monster"};
    actorPool.push_back(&a1);
    
    Handle h1 = {0};
    Actor* res1 = resolveHandle(h1);
    
    if (res1 && res1->name == "Monster") {
        Handle hInvalid = {999};
        if (resolveHandle(hInvalid) == nullptr) {
            std::cout << "TEST_PASSED" << std::endl;
            return 0;
        }
    }
    
    std::cout << "TEST_FAILED: ハンドルの解決に失敗したか、範囲外チェックが行われていません。" << std::endl;
    return 1;
}
`,
    hint: "1. `handle.id` が `actorPool.size()` 未満であることを確認します。 2. 条件を満たす場合は `actorPool[handle.id]` を返し、そうでない場合は `nullptr` を返します。",
    solution: `Actor* resolveHandle(Handle handle) {
    if (handle.id < actorPool.size()) {
        return actorPool[handle.id];
    }
    return nullptr;
}`,
    clientValidation: (code: string) => {
      if (!code.includes("actorPool")) return "テスト失敗: actorPool を使用して解決してください。";
      return null;
    }
  },
  {
    id: "game-placement-new",
    category: "Game Programming",
    title: "2. Placement New によるメモリ管理 (Placement New)",
    description: "パフォーマンスが極めて重要なゲーム開発では、`new` による動的メモリ確保のオーバーヘッドとフラグメンテーションを抑えるため、事前に確保されたメモリブロック上にオブジェクトを構築する `placement new`（配置new）が利用されます。",
    task: "あらかじめ用意されたバッファ `buffer` 上に、`placement new` を用いて `Actor` オブジェクトを構築してください。構築されたオブジェクトのポインタを `actor` 変数に代入してください。",
    initialCode: `#include <iostream>
#include <string>
#include <new> // placement new のために必要

class Actor {
public:
    Actor(std::string name) : name(name) {
        std::cout << "Actor " << name << " constructed at " << this << std::endl;
    }
    ~Actor() {
        std::cout << "Actor " << name << " destroyed" << std::endl;
    }
    std::string name;
};

int main() {
    // Actor 1つ分のメモリをスタック上に確保（アライメントに注意）
    alignas(Actor) char buffer[sizeof(Actor)];
    
    // --- TODO: buffer 上に placement new で Actor("Hero") を構築してください ---
    Actor* actor = 
    
    if (actor) {
        std::cout << "Created: " << actor->name << std::endl;
        // placement new で作ったオブジェクトは、手動でデストラクタを呼ぶ必要があります
        actor->~Actor();
    }
    
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <string>
#include <new>

int main() {
    alignas(Actor) char buffer[sizeof(Actor)];
    
    // ユーザーのコードに placement new が含まれているか（擬似的なチェック）
    // 実際には標準出力などで構築を確認します
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `new (宛先ポインタ) クラス名(引数リスト)` という構文を使います。 2. この場合、`new (buffer) Actor(\"Hero\")` となります。",
    solution: `Actor* actor = new (buffer) Actor("Hero");`,
    clientValidation: (code: string) => {
      if (!code.includes("new (buffer)")) return "テスト失敗: placement new 構文 `new (buffer) ...` を使用してください。";
      return null;
    }
  },
  {
    id: "game-abstract-interface",
    category: "Game Programming",
    title: "3. 抽象インターフェイスによる描画系の抽象化 (Abstract Interface)",
    description: "異なるプラットフォームや描画API（DirectX, OpenGL, Vulkan等）に対応するため、ゲームエンジンでは抽象インターフェイスを介して描画命令を発行します。これにより、上位のロジックを変更することなく、描画システムを差し替えることが可能になります。",
    task: "`IRenderer` インターフェイスを継承した `VulkanRenderer` クラスを実装してください。`render` メソッド内で \"Vulkan Rendering\" と出力してください。",
    initialCode: `#include <iostream>
#include <string>

// 抽象インターフェイス
class IRenderer {
public:
    virtual ~IRenderer() {}
    virtual void render() = 0;
};

// --- TODO: IRenderer を継承して VulkanRenderer を実装してください ---


int main() {
    // ポインタを介してポリモーフィックに使用
    IRenderer* renderer = new VulkanRenderer();
    renderer->render();
    delete renderer;
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <sstream>

int main() {
    std::stringstream buffer;
    std::streambuf* old = std::cout.rdbuf(buffer.rdbuf());
    
    IRenderer* renderer = new VulkanRenderer();
    renderer->render();
    delete renderer;
    
    std::cout.rdbuf(old);
    std::string output = buffer.str();
    
    if (output.find("Vulkan Rendering") != std::string::npos) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    } else {
        std::cout << "TEST_FAILED: 正しい文字列が出力されていません。" << std::endl;
        return 1;
    }
}
`,
    hint: "1. `class VulkanRenderer : public IRenderer` と宣言します。 2. `void render() override` メソッドを実装し、`std::cout` を使用します。",
    solution: `class VulkanRenderer : public IRenderer {
public:
    void render() override {
        std::cout << "Vulkan Rendering" << std::endl;
    }
};`,
    clientValidation: (code: string) => {
      if (!code.includes("override")) return "テスト失敗: `render` メソッドに `override` 指定子を付けてください。";
      return null;
    }
  },
  {
    id: "game-object-factory",
    category: "Game Programming",
    title: "4. 簡単なオブジェクトファクトリ (Object Factory)",
    description: "ゲーム中に動的に多種多様なオブジェクトを生成する場合、生成ロジックを1か所にまとめる「ファクトリ」パターンが便利です。特にシリアライズされたデータからオブジェクトを復元する際に重要になります。",
    task: "文字列引数を受け取り、\"Warrior\" なら `Warrior` クラス、\"Mage\" なら `Mage` クラスのインスタンスを生成して返す `ActorFactory::createActor` を実装してください。",
    initialCode: `#include <iostream>
#include <string>
#include <memory>

class Actor {
public:
    virtual ~Actor() {}
    virtual std::string getType() const = 0;
};

class Warrior : public Actor {
public:
    std::string getType() const override { return "Warrior"; }
};

class Mage : public Actor {
public:
    std::string getType() const override { return "Mage"; }
};

class ActorFactory {
public:
    static std::unique_ptr<Actor> createActor(const std::string& type) {
        // --- TODO: type に応じて適切なオブジェクトを生成してください ---
        
    }
};

int main() {
    auto a = ActorFactory::createActor("Warrior");
    if (a) std::cout << "Created: " << a->getType() << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <string>
#include <memory>

int main() {
    auto w = ActorFactory::createActor("Warrior");
    auto m = ActorFactory::createActor("Mage");
    auto u = ActorFactory::createActor("Unknown");
    
    if (w && w->getType() == "Warrior" && m && m->getType() == "Mage" && !u) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    }
    
    std::cout << "TEST_FAILED: ファクトリの生成ロジックが正しくありません。" << std::endl;
    return 1;
}
`,
    hint: "1. `if (type == \"Warrior\")` などの条件分岐を使用します。 2. `std::make_unique<Warrior>()` を使用して `unique_ptr` を返します。 3. 一致するものがない場合は `nullptr` を返します。",
    solution: `static std::unique_ptr<Actor> createActor(const std::string& type) {
    if (type == "Warrior") return std::make_unique<Warrior>();
    if (type == "Mage") return std::make_unique<Mage>();
    return nullptr;
}`,
  },
  {
    id: "game-class-lifecycle",
    category: "Game Programming",
    title: "5. クラスのライフサイクル (Class Lifecycle)",
    description: "ゲームオブジェクトの基底クラスでは、適切なリソース管理のために、メンバ初期化リスト、仮想デストラクタ、そして意図しないコピーの禁止（または適切な実装）が不可欠です。",
    task: "`BaseActor` クラスで以下の対応を行ってください： 1. メンバ初期化リストを使用 2. 仮想デストラクタを実装 3. コピーコンストラクタを禁止(= delete)",
    initialCode: `#include <iostream>
#include <string>

class BaseActor {
public:
    // --- TODO: メンバ初期化リストを使用し、コピーを禁止してください ---
    BaseActor(int id, std::string name) {
        this->id = id;
        this->name = name;
    }

    // --- TODO: デストラクタを virtual にしてください ---
    ~BaseActor() {
        std::cout << "BaseActor destroyed" << std::endl;
    }

private:
    int id;
    std::string name;
};

int main() {
    BaseActor actor(1, "Player");
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <type_traits>

int main() {
    if (std::is_copy_constructible<BaseActor>::value) {
        std::cout << "TEST_FAILED: コピーが禁止されていません。" << std::endl;
        return 1;
    }
    // 仮想デストラクタのチェックはコンパイル時のフラグ等で難しいが、ソースチェックで代用
    std::cout << "TEST_PASSED" << std::endl;
    return 0;
}
`,
    hint: "1. `BaseActor(...) : id(id), name(name) {}` 2. `virtual ~BaseActor()` 3. `BaseActor(const BaseActor&) = delete;`",
    solution: `class BaseActor {
public:
    BaseActor(int id, std::string name) : id(id), name(name) {}
    
    virtual ~BaseActor() {
        std::cout << "BaseActor destroyed" << std::endl;
    }

    BaseActor(const BaseActor&) = delete;
    BaseActor& operator=(const BaseActor&) = delete;

private:
    int id;
    std::string name;
};`,
    clientValidation: (code: string) => {
      if (!code.includes(": id(id)")) return "テスト失敗: メンバ初期化リストを使用してください。";
      if (!code.includes("virtual ~BaseActor")) return "テスト失敗: デストラクタを virtual にしてください。";
      if (!code.includes("= delete")) return "テスト失敗: コピーコンストラクタを禁止してください。";
      return null;
    }
  },
  {
    id: "game-virtual-inheritance",
    category: "Game Programming",
    title: "6. 仮想継承と菱形継承 (Virtual Inheritance)",
    description: "複数の経路から共通の基底クラスを継承する際、基底クラスの実体が複数生成される「菱形継承問題」を解決するために、仮想継承（virtual inheritance）を使用します。",
    task: "`Actor` と `Prop` が `GameObject` を `virtual` 継承するように修正してください。これにより、`PlayerCharacter` 内で `id` メンバが一つに集約されます。",
    initialCode: `#include <iostream>

class GameObject {
public:
    int id = 0;
};

// --- TODO: GameObject を virtual 継承するように変更してください ---
class Actor : public GameObject {};
class Prop : public GameObject {};

class PlayerCharacter : public Actor, public Prop {};

int main() {
    PlayerCharacter pc;
    // virtual 継承していない場合、pc.id は「Actor::id か Prop::id か」曖昧になりコンパイルエラーとなります
    pc.id = 100; 
    std::cout << "GameObject ID: " << pc.id << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>

int main() {
    PlayerCharacter pc;
    pc.id = 500;
    if (pc.id == 500) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    }
    std::cout << "TEST_FAILED" << std::endl;
    return 1;
}
`,
    hint: "1. `class Actor : public virtual GameObject` 2. `class Prop : public virtual GameObject` という形式で継承します。",
    solution: `class Actor : public virtual GameObject {};
class Prop : public virtual GameObject {};`,
    clientValidation: (code: string) => {
      if (!code.includes("virtual GameObject")) return "テスト失敗: `virtual` キーワードを使用して継承してください。";
      return null;
    }
  },
  {
    id: "game-mixin-pattern",
    category: "Game Programming",
    title: "7. 多重継承による Mixin (Mixin Pattern)",
    description: "多重継承を利用して、独立した小規模なクラス（ミックスイン）を既存のクラスに組み合わせることで、柔軟な機能拡張が可能になります。",
    task: "`Player` クラスに `Flyable` と `Swimmable` の両方を継承させ、`action` メソッド内でそれらの機能（fly, swim）を呼び出してください。",
    initialCode: `#include <iostream>

class Flyable {
public:
    void fly() { std::cout << "[Fly] "; }
};

class Swimmable {
public:
    void swim() { std::cout << "[Swim] "; }
};

// --- TODO: Flyable と Swimmable を多重継承してください ---
class Player {
public:
    void action() {
        // ここで fly() と swim() を呼び出してください
        
    }
};

int main() {
    Player p;
    p.action();
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <sstream>

int main() {
    std::stringstream buffer;
    std::streambuf* old = std::cout.rdbuf(buffer.rdbuf());
    
    Player p;
    p.action();
    
    std::cout.rdbuf(old);
    std::string output = buffer.str();
    
    if (output.find("[Fly]") != std::string::npos && output.find("[Swim]") != std::string::npos) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    }
    std::cout << "TEST_FAILED: 各機能が正しく呼び出されていません。" << std::endl;
    return 1;
}
`,
    hint: "1. `class Player : public Flyable, public Swimmable` 2. `action` 内で単に `fly();` と `swim();` を呼び出します。",
    solution: `class Player : public Flyable, public Swimmable {
public:
    void action() {
        fly();
        swim();
    }
};`,
    clientValidation: (code: string) => {
      if (!code.includes("public Flyable") || !code.includes("public Swimmable")) {
          return "テスト失敗: Flyable と Swimmable を多重継承してください。";
      }
      return null;
    }
  },
  {
    id: "game-plugin-system",
    category: "Game Programming",
    title: "8. 抽象インターフェイスによるプラグインシステム (Plugin System)",
    description: "ゲームエンジンでは、機能を拡張するためにプラグインシステムが使われます。メインエンジンは各プラグインの具体的な実装を知らなくても、共通のインターフェイス（抽象クラス）を通じて追加された機能を操作できます。",
    task: "`IGamePlugin` インターフェイスを実装した `PhysicsPlugin` クラスを作成してください。また、`main` 関数内でそのインスタンスを `PluginManager` に登録してください。",
    initialCode: `#include <iostream>
#include <vector>
#include <string>
#include <memory>

// プラグインのインターフェイス
class IGamePlugin {
public:
    virtual ~IGamePlugin() {}
    virtual void onInit() = 0;
    virtual std::string getName() const = 0;
};

// --- TODO: IGamePlugin を継承して PhysicsPlugin を実装してください ---
// getName() は "Physics Engine" を、onInit() は "Physics Initialized" と出力するようにしてください。


class PluginManager {
public:
    void registerPlugin(std::unique_ptr<IGamePlugin> plugin) {
        if (plugin) {
            std::cout << "Registering: " << plugin->getName() << std::endl;
            plugins.push_back(std::move(plugin));
        }
    }
    
    void initAll() {
        for (auto& p : plugins) p->onInit();
    }

private:
    std::vector<std::unique_ptr<IGamePlugin>> plugins;
};

int main() {
    PluginManager manager;
    
    // --- TODO: PhysicsPlugin を生成して manager.registerPlugin に渡してください ---

    manager.initAll();
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <sstream>
#include <memory>

int main() {
    std::stringstream buffer;
    std::streambuf* old = std::cout.rdbuf(buffer.rdbuf());
    
    PluginManager manager;
    manager.registerPlugin(std::make_unique<PhysicsPlugin>());
    manager.initAll();
    
    std::cout.rdbuf(old);
    std::string output = buffer.str();
    
    if (output.find("Physics Initialized") != std::string::npos && 
        output.find("Registering: Physics Engine") != std::string::npos) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    }
    
    std::cout << "TEST_FAILED: プラグインが正しく登録または初期化されていません。" << std::endl;
    return 1;
}
`,
    hint: "1. `class PhysicsPlugin : public IGamePlugin` と宣言します。 2. `onInit` と `getName` を `override` 指定で実装します。 3. `main` 内では `manager.registerPlugin(std::make_unique<PhysicsPlugin>());` を呼び出します。",
    solution: `class PhysicsPlugin : public IGamePlugin {
public:
    void onInit() override { std::cout << "Physics Initialized" << std::endl; }
    std::string getName() const override { return "Physics Engine"; }
};

// main 内
manager.registerPlugin(std::make_unique<PhysicsPlugin>());`,
    clientValidation: (code: string) => {
      if (!code.includes("PhysicsPlugin")) return "テスト失敗: PhysicsPlugin クラスを定義してください。";
      if (!code.includes("registerPlugin")) return "テスト失敗: プラグインを登録してください。";
      return null;
    }
  },
  {
    id: "game-memory-pool",
    category: "Game Programming",
    title: "9. 固定サイズメモリプール (Memory Pool)",
    description: "頻繁なオブジェクトの生成と破棄が必要なゲーム開発では、ヒープからのメモリ確保・解放を繰り返すと、パフォーマンス低下やメモリの断片化（フラグメンテーション）が起こります。あらかじめ固定サイズの配列を確保しておく「メモリプール」はその解決策の一つです。",
    task: "10個の `Actor` オブジェクトを保持できるメモリプールから、空いている（`id == -1`）スロットを探してそのポインタを返す `allocate()` メソッドを実装してください。空きがない場合は `nullptr` を返してください。",
    initialCode: `#include <iostream>

struct Actor {
    int id; // -1 の場合は空きスロットとみなす
};

class MemoryPool {
public:
    MemoryPool() {
        for (int i = 0; i < 10; ++i) {
            actorStorage[i].id = -1;
        }
    }

    // --- TODO: 空いているスロットを探してポインタを返してください ---
    Actor* allocate() {
        
    }

private:
    Actor actorStorage[10];
};

int main() {
    MemoryPool pool;
    Actor* a1 = pool.allocate();
    if (a1) {
        a1->id = 100;
        std::cout << "Allocated!" << std::endl;
    }
    return 0;
}
`,
    testCode: `
#include <iostream>

int main() {
    MemoryPool pool;
    // 全部埋める
    for(int i=0; i<10; ++i) {
        Actor* a = pool.allocate();
        if (!a) {
             std::cout << "TEST_FAILED: スロットがまだあるのに allocate できませんでした。" << std::endl;
             return 1;
        }
        a->id = i;
    }
    
    // 11個目は失敗するはず
    if (pool.allocate() == nullptr) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    }
    
    std::cout << "TEST_FAILED: キャパシティを超えて割り当てできてしまいました。" << std::endl;
    return 1;
}
`,
    hint: "1. `for` ループで `actorStorage` を走査します。 2. `id == -1` の要素が見つかったら、そのアドレス（`&actorStorage[i]`）を返します。",
    solution: `Actor* allocate() {
    for (int i = 0; i < 10; ++i) {
        if (actorStorage[i].id == -1) {
            return &actorStorage[i];
        }
    }
    return nullptr;
}`,
  },
  {
    id: "game-soa-design",
    category: "Game Programming",
    title: "10. データ指向設計 (SoA: Structure of Arrays)",
    description: "大量のオブジェクトを更新する場合、オブジェクトの配列 (AoS: Array of Structures) よりも、各属性ごとの配列 (SoA: Structure of Arrays) を持つ方が、CPUキャッシュの効率が良くなることがあります（データ指向設計）。",
    task: "`ParticleSystem` クラスの `update(float dt)` メソッドを実装し、すべてのパーティクルの `posX` 配列の要素に `dt` を加算してください。",
    initialCode: `#include <iostream>
#include <vector>

class ParticleSystem {
public:
    void addParticle(float x, float y) {
        posX.push_back(x);
        posY.push_back(y);
    }

    void update(float dt) {
        // --- TODO: すべての粒子の X 座標に dt を加算してください ---
        
    }

    float getX(int index) const { return posX[index]; }

private:
    std::vector<float> posX;
    std::vector<float> posY;
};

int main() {
    ParticleSystem ps;
    ps.addParticle(10.0f, 0.0f);
    ps.update(1.5f);
    std::cout << "New X: " << ps.getX(0) << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>

int main() {
    ParticleSystem ps;
    ps.addParticle(5.0f, 0.0f);
    ps.addParticle(10.0f, 0.0f);
    ps.update(2.0f);
    
    if (ps.getX(0) == 7.0f && ps.getX(1) == 12.0f) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    }
    std::cout << "TEST_FAILED: 加算処理が正しくありません。" << std::endl;
    return 1;
}
`,
    hint: "1. `posX.size()` までのループを回します。 2. `posX[i] += dt;` を実行します。",
    solution: `void update(float dt) {
    for (size_t i = 0; i < posX.size(); ++i) {
        posX[i] += dt;
    }
}`,
  },
  {
    id: "game-bit-flags",
    category: "Game Programming",
    title: "11. ビットフラグによる状態管理 (Bit Flags)",
    description: "キャラクターの「毒」「スタン」「無敵」といった多数のON/OFF状態を管理する場合、それぞれのフラグに1ビットを割り当てて一つの整数で管理することで、メモリ節約と高速な判定が可能になります。",
    task: "`Entity` クラスに、フラグを立てる `setFlag` と、フラグが立っているかを確認する `isFlagSet` を実装してください。",
    initialCode: `#include <iostream>

enum EntityState {
    Invisible = 1 << 0,
    Invulnerable = 1 << 1,
    Stunned = 1 << 2
};

class Entity {
public:
    void setFlag(EntityState state) {
        // --- TODO: flags の対応するビットを立ててください ---
        
    }

    bool isFlagSet(EntityState state) const {
        // --- TODO: flags の対応するビットが立っているかチェックしてください ---
        
    }

private:
    unsigned int flags = 0;
};

int main() {
    Entity e;
    e.setFlag(Invulnerable);
    if (e.isFlagSet(Invulnerable)) std::cout << "Invulnerable is set!" << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>

int main() {
    Entity e;
    e.setFlag(Invisible);
    e.setFlag(Stunned);
    
    if (e.isFlagSet(Invisible) && e.isFlagSet(Stunned) && !e.isFlagSet(Invulnerable)) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    }
    std::cout << "TEST_FAILED: ビット演算が正しくありません。" << std::endl;
    return 1;
}
`,
    hint: "1. ビットを立てるには OR 演算子 `|=` を使用します。 2. 判定には AND 演算子 `&` を使用します。",
    solution: `void setFlag(EntityState state) {
    flags |= state;
}

bool isFlagSet(EntityState state) const {
    return (flags & state) != 0;
}`,
  },
  {
    id: "game-inline-functions",
    category: "Game Programming",
    title: "12. インライン関数による最適化 (Inline Functions)",
    description: "プロパティの取得（ゲッター）や単純な数学演算など、非常に小規模で頻繁に呼び出される関数は、関数の呼び出しコスト自体が無視できなくなることがあります。`inline` を指定することで、コンパイラに関数の内容を呼び出し元に直接展開するよう促すことができます。",
    task: "2つの `Vector2` を加算する `add` 関数をインライン関数として定義してください。",
    initialCode: `#include <iostream>

struct Vector2 {
    float x, y;
};

// --- TODO: この関数を inline 化してください ---
Vector2 add(const Vector2& a, const Vector2& b) {
    return { a.x + b.x, a.y + b.y };
}

int main() {
    Vector2 v1 = {1.0f, 2.0f};
    Vector2 v2 = {3.0f, 4.0f};
    Vector2 res = add(v1, v2);
    std::cout << "Res: " << res.x << ", " << res.y << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>

int main() {
    // ユーザーコードに inline が含まれているかチェック
    // 実行結果を確認
    Vector2 v = add({1, 1}, {2, 2});
    if (v.x == 3.0f && v.y == 3.0f) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    }
    std::cout << "TEST_FAILED" << std::endl;
    return 1;
}
`,
    hint: "1. 関数の戻り値の型の前に `inline` キーワードを追加します。",
    solution: `inline Vector2 add(const Vector2& a, const Vector2& b) {
    return { a.x + b.x, a.y + b.y };
}`,
    clientValidation: (code: string) => {
      if (!code.includes("inline")) return "テスト失敗: `inline` キーワードを使用してください。";
      return null;
    }
  },
  {
    id: "game-safe-cast",
    category: "Game Programming",
    title: "13. 安全なダウンキャスト (Safe Casting)",
    description: "C++の `dynamic_cast` は実行時に型チェックを行いますが、パフォーマンス上の理由からゲーム開発では、独自の型IDを用いた高速なキャスト（`static_cast` と型チェックの組み合わせ）を自前で実装することが一般的です。",
    task: "型ID `EntityType` をチェックして、`Monster` クラスへの有効なポインタであれば `static_cast` で変換して返し、そうでなければ `nullptr` を返す `asMonster` 関数を実装してください。",
    initialCode: `#include <iostream>
#include <string>

enum class EntityType { Entity, Actor, Monster };

class Entity {
public:
    virtual ~Entity() {}
    virtual EntityType getType() const { return EntityType::Entity; }
};

class Monster : public Entity {
public:
    EntityType getType() const override { return EntityType::Monster; }
    void roar() { std::cout << "Monster Roar!" << std::endl; }
};

// --- TODO: EntityType をチェックして安全にキャストする関数を実装してください ---
Monster* asMonster(Entity* e) {
    
}

int main() {
    Entity* e = new Monster();
    Monster* m = asMonster(e);
    if (m) m->roar();
    delete e;
    return 0;
}
`,
    testCode: `
#include <iostream>

int main() {
    Entity* e1 = new Monster();
    Entity* e2 = new Entity();
    
    Monster* m1 = asMonster(e1);
    Monster* m2 = asMonster(e2);
    
    if (m1 != nullptr && m2 == nullptr) {
        std::cout << "TEST_PASSED" << std::endl;
        delete e1;
        delete e2;
        return 0;
    }
    
    std::cout << "TEST_FAILED: キャストの判定ロジックが正しくありません。" << std::endl;
    delete e1;
    delete e2;
    return 1;
}
`,
    hint: "1. `e` が `nullptr` でないことを確認します。 2. `e->getType() == EntityType::Monster` かどうかをチェックします。 3. 条件を満たすなら `static_cast<Monster*>(e)` を、そうでないなら `nullptr` を返します。",
    solution: `Monster* asMonster(Entity* e) {
    if (e && e->getType() == EntityType::Monster) {
        return static_cast<Monster*>(e);
    }
    return nullptr;
}`,
  },
  {
    id: "game-const-correctness",
    category: "Game Programming",
    title: "14. Const-正しい設計 (Const-Correctness)",
    description: "描画関数(render)など、オブジェクトの状態を変更すべきでない関数を `const` メンバ関数にすることで、バグを未然に防ぎ、コードの意図を明確にできます。また、`const` オブジェクトに対してもその関数が呼べるようになります。",
    task: "`GameObject` クラスの `render()` メソッドを `const` メンバ関数にし、関数内で状態を変更（healthを減らす）しようとしている誤った処理をコメントアウトまたは削除してください。",
    initialCode: `#include <iostream>
#include <string>

class GameObject {
public:
    GameObject(std::string name) : name(name), health(100) {}

    // --- TODO: この関数を const メンバ関数にし、不適切な変更処理を削除してください ---
    void render() {
        // バグ：描画処理の中で HP を減らしてはいけません！
        health -= 10; 
        std::cout << "Rendering " << name << " (HP: " << health << ")" << std::endl;
    }

    int getHealth() const { return health; }

private:
    std::string name;
    int health;
};

int main() {
    const GameObject stone("Small Stone");
    stone.render(); // const メンバ関数にしないとコンパイルエラーになります
    return 0;
}
`,
    testCode: `
#include <iostream>

int main() {
    const GameObject g("Test");
    int initialHP = g.getHealth();
    g.render();
    
    if (g.getHealth() == initialHP) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    }
    std::cout << "TEST_FAILED: 描画関数内でHPが変更されました。" << std::endl;
    return 1;
}
`,
    hint: "1. 関数プロトタイプの末尾に `const` を付けます（`void render() const { ... }`）。 2. 関数内で `health -= 10;` を削除すると、`health` を変更できなくなるため、コンパイラもエラーを出さなくなります。",
    solution: `void render() const {
    std::cout << "Rendering " << name << " (HP: " << health << ")" << std::endl;
}`,
    clientValidation: (code: string) => {
      if (!code.match(/void\s+render\(\)\s+const/)) return "テスト失敗: render メソッドを const メンバ関数にしてください。";
      if (code.includes("health -=")) return "テスト失敗: 描画関数内で health を変更してはいけません。";
      return null;
    }
  },
  {
    id: "game-error-handling",
    category: "Game Programming",
    title: "15. 例外を使わないエラー処理 (Error Handling)",
    description: "ゲームプログラムでは、例外処理(try-catch)による実行時のオーバーヘッドを避けるため（または特定のプラットフォームの制限により）、古いC言語のような戻り値ベース、あるいはモダンな `Result`（または `Optional`）型によるエラー処理が好まれます。",
    task: "セーブデータを読み込む `loadGameData` 関数を実装してください。`id` が 0 未満なら失敗、0 以上なら成功（データ \"PlayerSaveData\"）を `Result` 構造体で返してください。",
    initialCode: `#include <iostream>
#include <string>

struct Result {
    bool isSuccess;
    std::string data;
};

// --- TODO: Result 構造体を使用して結果を返す関数を実装してください ---
Result loadGameData(int userId) {
    
}

int main() {
    Result res = loadGameData(123);
    if (res.isSuccess) {
        std::cout << "Data: " << res.data << std::endl;
    } else {
        std::cout << "Error occurred." << std::endl;
    }
    return 0;
}
`,
    testCode: `
#include <iostream>

int main() {
    Result r1 = loadGameData(10);
    Result r2 = loadGameData(-1);
    
    if (r1.isSuccess && r1.data == "PlayerSaveData" && !r2.isSuccess) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    }
    std::cout << "TEST_FAILED: エラー処理のロジックが期待通りではありません。" << std::endl;
    return 1;
}
`,
    hint: "1. `if (userId < 0) return { false, \"\" };` 2. `return { true, \"PlayerSaveData\" };` のように実装します。",
    solution: `Result loadGameData(int userId) {
    if (userId < 0) {
        return { false, "" };
    }
    return { true, "PlayerSaveData" };
}`,
  },
  {
    id: "game-template-allocator",
    category: "Game Programming",
    title: "16. テンプレートによるアロケータの抽象化 (Template Allocator)",
    description: "アロケータをテンプレート化することで、任意の型に対して独自のメモリ管理戦略（プール、スタックアロケータ等）を適用できるようになります。STLのコンテナもこれと同じ仕組みでメモリ確保を抽象化しています。",
    task: "引数でもらったメモリ領域 `ptr` 上に、テンプレート引数 `T` の型のオブジェクトを `placement new` で構築する `allocateAt` メソッドを実装してください。",
    initialCode: `#include <iostream>
#include <new>

template <typename T>
class TinyAllocator {
public:
    // --- TODO: ptr 上に T オブジェクトを構築してポインタを返すメソッドを実装してください ---
    T* allocateAt(void* ptr) {
        
    }
};

struct Bullet {
    float velocity = 100.0f;
};

int main() {
    alignas(Bullet) char memory[sizeof(Bullet)];
    TinyAllocator<Bullet> alloc;
    
    Bullet* b = alloc.allocateAt(memory);
    if (b) {
        std::cout << "Bullet Speed: " << b->velocity << std::endl;
        b->~Bullet();
    }
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <new>

int main() {
    alignas(int) char buf[sizeof(int)];
    TinyAllocator<int> alloc;
    int* val = alloc.allocateAt(buf);
    *val = 123;
    
    if (*val == 123) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    }
    std::cout << "TEST_FAILED" << std::endl;
    return 1;
}
`,
    hint: "1. `return new (ptr) T();` を使用して、指定された型 `T` を `placement new` で構築します。",
    solution: `T* allocateAt(void* ptr) {
    return new (ptr) T();
}`,
  },
  {
    id: "game-state-machine",
    category: "Game Programming",
    title: "17. 有限状態マシン (Finite State Machine)",
    description: "キャラクターの行動（待機、追跡、攻撃など）を管理するために、状態（State）を列挙型やクラスとして定義し、条件に応じて切り替える手法（FSM）はゲームAIの基本です。",
    task: "`Enemy` クラスの `update` メソッドを実装し、`distanceToPlayer` が 5.0 未満なら状態を `State::Chase` に、それ以外なら `State::Idle` に切り替えるようにしてください。",
    initialCode: `#include <iostream>
#include <string>

enum class State { Idle, Chase };

class Enemy {
public:
    void update(float distanceToPlayer) {
        // --- TODO: 距離に応じて状態を切り替えてください ---
        
    }

    std::string getStateName() const {
        return (state == State::Idle) ? "Idle" : "Chase";
    }

private:
    State state = State::Idle;
};

int main() {
    Enemy e;
    e.update(3.0f);
    std::cout << "State: " << e.getStateName() << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>

int main() {
    Enemy e;
    e.update(10.0f);
    if (e.getStateName() != "Idle") {
        std::cout << "TEST_FAILED: 距離が遠いのに Idle になっていません。" << std::endl;
        return 1;
    }
    
    e.update(3.0f);
    if (e.getStateName() == "Chase") {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    }
    
    std::cout << "TEST_FAILED: 距離が近いのに Chase になっていません。" << std::endl;
    return 1;
}
`,
    hint: "1. `if (distanceToPlayer < 5.0f)` で分岐させ、`state = State::Chase;` または `state = State::Idle;` を代入します。",
    solution: `void update(float distanceToPlayer) {
    if (distanceToPlayer < 5.0f) {
        state = State::Chase;
    } else {
        state = State::Idle;
    }
}`,
  },
  {
    id: "game-command-pattern",
    category: "Game Programming",
    title: "18. コマンドパターン (Command Pattern)",
    description: "アクションを「オブジェクト」としてカプセル化することで、入力と行動を分離したり、リプレイ機能やUndo（取り消し）機能を実装しやすくしたりできます。",
    task: "`Command` 抽象クラスを継承して `JumpCommand` クラスを完成させてください。`execute` メソッド内で `actor.jump()` を呼び出します。",
    initialCode: `#include <iostream>

class Actor {
public:
    void jump() { std::cout << "[Jump] "; }
};

class Command {
public:
    virtual ~Command() {}
    virtual void execute(Actor& actor) = 0;
};

// --- TODO: Command を継承して JumpCommand を実装してください ---
class JumpCommand : public Command {
public:
    void execute(Actor& actor) override {
        
    }
};

int main() {
    Actor player;
    JumpCommand jump;
    // 本来は Command* として保持して実行します
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <sstream>

int main() {
    std::stringstream buffer;
    std::streambuf* old = std::cout.rdbuf(buffer.rdbuf());
    
    Actor player;
    JumpCommand jump;
    Command& cmd = jump;
    cmd.execute(player);
    
    std::cout.rdbuf(old);
    std::string output = buffer.str();
    
    if (output.find("[Jump]") != std::string::npos) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    }
    std::cout << "TEST_FAILED: execute 内で actor.jump() が呼ばれていません。" << std::endl;
    return 1;
}
`,
    hint: "1. `class JumpCommand : public Command` と継承します。 2. `void execute(Actor& actor) override { actor.jump(); }` を実装します。",
    solution: `class JumpCommand : public Command {
public:
    void execute(Actor& actor) override {
        actor.jump();
    }
};`,
  },
  {
    id: "game-service-locator",
    category: "Game Programming",
    title: "19. サービスロケータ (Service Locator)",
    description: "シングルトンの代わりとして、オーディオや描画などの「サービス」を一箇所で提供・管理する仕組みです。テスト時にはモック（偽物）のサービスに容易に差し替えることができます。",
    task: "`ServiceLocator` からオーディオシステムを取得し、音を鳴らす処理を `main` 関数内に実装してください。",
    initialCode: `#include <iostream>

class IAudio {
public:
    virtual ~IAudio() {}
    virtual void playSound() = 0;
};

class SimpleAudio : public IAudio {
public:
    void playSound() override { std::cout << "BEEP! "; }
};

class ServiceLocator {
public:
    static IAudio* getAudio() { return service; }
    static void provide(IAudio* s) { service = s; }
private:
    static IAudio* service;
};

IAudio* ServiceLocator::service = nullptr;

int main() {
    SimpleAudio audio;
    ServiceLocator::provide(&audio);
    
    // --- TODO: ServiceLocator から Audio を取得して playSound() を呼んでください ---
    
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <sstream>

int main() {
    std::stringstream buffer;
    std::streambuf* old = std::cout.rdbuf(buffer.rdbuf());
    
    SimpleAudio audio;
    ServiceLocator::provide(&audio);
    
    // ユーザーコードを実行するための擬似 main 処理
    IAudio* a = ServiceLocator::getAudio();
    if(a) a->playSound();
    
    std::cout.rdbuf(old);
    if (buffer.str().find("BEEP!") != std::string::npos) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    }
    std::cout << "TEST_FAILED" << std::endl;
    return 1;
}
`,
    hint: "1. `IAudio* audio = ServiceLocator::getAudio();` 2. `if (audio) audio->playSound();` を記述します。",
    solution: `IAudio* audio = ServiceLocator::getAudio();
if (audio) {
    audio->playSound();
}`,
  },
  {
    id: "game-custom-rtti",
    category: "Game Programming",
    title: "20. カスタムRTTI (Custom RTTI)",
    description: "C++標準の `typeid` は、コンパイラ設定やプラットフォームによってバイナリサイズが増大したり、低速な場合があります。ゲーム開発では、独自の整数IDで型を識別する仕組みがよく自作されます。",
    task: "`Monster` クラスに、自身の型IDを返す `getTypeId()` メソッドをオーバーライド実装してください。",
    initialCode: `#include <iostream>

class BaseEntity {
public:
    virtual int getTypeId() const = 0;
};

class Monster : public BaseEntity {
public:
    static const int TYPE_ID = 1001;
    // --- TODO: getTypeId() をオーバーライドして TYPE_ID を返してください ---
    
};

int main() {
    Monster m;
    if (m.getTypeId() == 1001) {
        std::cout << "Type matches!" << std::endl;
    }
    return 0;
}
`,
    testCode: `
#include <iostream>

int main() {
    Monster m;
    BaseEntity* b = &m;
    if (b->getTypeId() == 1001) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    }
    std::cout << "TEST_FAILED" << std::endl;
    return 1;
}
`,
    hint: "1. `int getTypeId() const override { return TYPE_ID; }` と実装します。",
    solution: `int getTypeId() const override {
    return TYPE_ID;
}`,
  },
  {
    id: "game-serialization",
    category: "Game Programming",
    title: "21. シリアライズの基礎 (Serialization)",
    description: "メモリ上のオブジェクトを、セーブデータや通信用に「保存可能なデータ形式（文字列やバイナリ）」に変換することをシリアライズと呼びます。",
    task: "`Player` クラスのデータを \"Score:[スコア]\" という形式で文字列化する `serialize` メソッドを実装してください。",
    initialCode: `#include <iostream>
#include <string>
#include <sstream>

class Player {
public:
    int score = 500;

    // --- TODO: "Score:[score]" という文字列を返すようにしてください ---
    std::string serialize() const {
        
    }
};

int main() {
    Player p;
    std::cout << p.serialize() << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>

int main() {
    Player p;
    p.score = 999;
    if (p.serialize() == "Score:999") {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    }
    std::cout << "TEST_FAILED: " << p.serialize() << std::endl;
    return 1;
}
`,
    hint: "1. `std::stringstream` を使うか、`std::to_string(score)` を使用して文字列を作成します。",
    solution: `std::string serialize() const {
    return "Score:" + std::to_string(score);
}`,
  },
  {
    id: "math-euclidean-distance",
    category: "数学",
    title: "数学：2点間の距離の計算",
    description: "2次元平面上の2点 $(x_1, y_1)$ と $(x_2, y_2)$ の間の距離 $d$ を求める公式 $d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$ をプログラムで実装しましょう。ゲーム開発では、キャラクター間の距離判定などに不可欠な計算です。",
    task: "`std::sqrt` と `std::pow`（または単純な掛け算）を使用して、2点間の距離を返す関数 `calculateDistance` を完成させてください。",
    initialCode: `#include <iostream>
#include <cmath>
#include <iomanip>

double calculateDistance(double x1, double y1, double x2, double y2) {
    // TODO: ここに公式を実装してください
    return 0.0;
}

int main() {
    std::cout << std::fixed << std::setprecision(2);
    std::cout << "Distance (0,0) to (3,4): " << calculateDistance(0, 0, 3, 4) << " (Expected: 5.00)" << std::endl;
    return 0;
}
`,
    testCode: `
#include <iostream>
#include <cmath>
#include <cassert>

int main() {
    auto isNear = [](double a, double b) { return std::abs(a - b) < 0.001; };
    
    if (isNear(calculateDistance(0, 0, 3, 4), 5.0) && 
        isNear(calculateDistance(1, 2, 4, 6), 5.0) &&
        isNear(calculateDistance(-1, -1, 2, 3), 5.0)) {
        std::cout << "TEST_PASSED" << std::endl;
        return 0;
    } else {
        std::cout << "TEST_FAILED" << std::endl;
        return 1;
    }
}
`,
    hint: "1. `std::sqrt` は平方根を、`std::pow(x, 2)` は2乗を計算します。 2. 公式の引数の差 $(x_2 - x_1)$ と $(y_2 - y_1)$ をそれぞれ計算してから、それらを2乗して足し合わせ、最後に平方根をとります。",
    solution: `double calculateDistance(double x1, double y1, double x2, double y2) {
    double dx = x2 - x1;
    double dy = y2 - y1;
    return std::sqrt(dx * dx + dy * dy);
}`,
  },
];

const categoryDefaults: Record<ProblemCategory, Pick<LearningProblem, "difficulty" | "estimatedMinutes" | "skills" | "reviewAfterDays" | "mode" | "templateSteps">> = {
  "Refactoring": {
    difficulty: 1,
    estimatedMinutes: 6,
    skills: ["コードを小さく分ける", "責務を分離する"],
    reviewAfterDays: 2,
    mode: "guided",
    templateSteps: ["対象の処理を1つに絞る", "新しい関数や型を追加する", "元の処理を呼び出しに置き換える"],
  },
  "Design Patterns": {
    difficulty: 2,
    estimatedMinutes: 8,
    skills: ["役割分担", "抽象化", "依存の向きを整える"],
    reviewAfterDays: 3,
    mode: "guided",
    templateSteps: ["共通インターフェースを作る", "具体クラスを分ける", "呼び出し側の分岐を減らす"],
  },
  "Effective C++": {
    difficulty: 2,
    estimatedMinutes: 5,
    skills: ["C++の設計原則", "const 正しさ", "リソース管理"],
    reviewAfterDays: 3,
    mode: "guided",
    templateSteps: ["問題のある宣言や代入箇所を見つける", "Item の原則に沿って書き換える", "最小差分で振る舞いを保つ"],
  },
  "C++の基礎": {
    difficulty: 1,
    estimatedMinutes: 4,
    skills: ["文法", "基本型", "制御構文"],
    reviewAfterDays: 2,
    mode: "fill-in-the-blank",
    templateSteps: ["TODO の箇所だけに集中する", "必要な文法を1つ書く", "期待出力を見て確認する"],
  },
  "Game Programming": {
    difficulty: 3,
    estimatedMinutes: 8,
    skills: ["設計", "パフォーマンス", "安全性"],
    reviewAfterDays: 4,
    mode: "guided",
    templateSteps: ["登場する責務を洗い出す", "必要な型や関数を追加する", "ゲームループや所有権との整合性を保つ"],
  },
  "数学": {
    difficulty: 1,
    estimatedMinutes: 4,
    skills: ["数式の実装", "標準ライブラリ", "値の確認"],
    reviewAfterDays: 2,
    mode: "fill-in-the-blank",
    templateSteps: ["式を小さな変数に分ける", "標準関数を1つずつ使う", "サンプル値で確かめる"],
  },
};

const problemOverrides: Partial<Record<string, Partial<LearningProblem>>> = {
  "extract-function": {
    difficulty: 1,
    estimatedMinutes: 5,
    skills: ["関数抽出", "出力処理の分離", "小さく直す"],
    prerequisites: ["for 文の読み取り", "関数定義"],
    hintSteps: [
      "まず `printReceipt(double total)` という関数の箱だけを作りましょう。",
      "`std::cout` を使っている3行を新しい関数へ移し、元の場所は `printReceipt(total);` だけにします。",
      "`processOrder` の中に `cout` が残っていないかだけ最後に確認すれば十分です。",
    ],
    successMessage: "処理を2つの責務に分けられました。読みやすさが上がり、次の変更もしやすくなっています。",
    reviewAfterDays: 2,
    mode: "fill-in-the-blank",
    templateSteps: ["関数を追加する", "出力3行を移動する", "元の場所を関数呼び出しに置き換える"],
    starterCode: `#include <iostream>
#include <vector>

void printReceipt(double total) {
    // TODO: レシートの3行をここに移動する
}

void processOrder(const std::vector<double>& prices) {
    double total = 0.0;
    for (double price : prices) {
        total += price;
    }

    // TODO: printReceipt を呼び出す
}

int main() {
    std::vector<double> myPrices = {10.5, 20.0, 5.25};
    processOrder(myPrices);
    return 0;
}
`,
  },
  "strategy-pattern": {
    difficulty: 2,
    estimatedMinutes: 8,
    skills: ["Strategy パターン", "抽象クラス", "分岐の置き換え"],
    prerequisites: ["継承", "virtual 関数"],
    hintSteps: [
      "最初に `PaymentStrategy` という抽象クラスを作り、`pay(int amount)` だけ宣言します。",
      "`CreditCardStrategy` と `PayPalStrategy` に出力ロジックを分けると、`if` を消しやすくなります。",
      "`PaymentProcessor` は種類を選ぶのではなく、渡された strategy に仕事を任せる形へ寄せましょう。",
    ],
    successMessage: "支払い方法ごとの分岐をオブジェクトに移せました。新しい支払い方法を増やしやすい設計です。",
  },
  "effective-cpp-item-20": {
    difficulty: 1,
    estimatedMinutes: 4,
    skills: ["const 参照", "スライシング回避", "ポリモーフィズム"],
    hintSteps: [
      "`Window w` を `const Window& w` に変えるだけで方向は合っています。",
      "本体はほぼそのままで大丈夫です。関数の受け取り方だけ直しましょう。",
      "参照にした後、`name()` と `display()` がそのまま呼べれば完成です。",
    ],
    successMessage: "値渡しによるスライシングを防げました。派生クラスの振る舞いを保ったまま扱えています。",
    mode: "fill-in-the-blank",
  },
  "cpp-basics-hello-world": {
    successMessage: "最初の一歩を完了しました。出力を確認できたのは立派な前進です。",
  },
  "math-euclidean-distance": {
    hintSteps: [
      "まず `dx` と `dy` を変数に分けると見通しが良くなります。",
      "`dx * dx + dy * dy` を作ってから `std::sqrt` をかけましょう。",
      "`pow` より単純な掛け算でも十分です。期待値 5.0 を目安に確認します。",
    ],
    successMessage: "数式をコードに落とし込めました。ゲームでも物理でもよく使う基本計算です。",
  },
};

const inferDifficulty = (problem: Problem, fallback: 1 | 2 | 3): 1 | 2 | 3 => {
  if (problem.difficulty) {
    return problem.difficulty;
  }

  if (problem.category === "Game Programming") {
    return 3;
  }

  if (problem.category === "C++の基礎" || problem.category === "数学") {
    return 1;
  }

  return fallback;
};

const withProblemDefaults = (problem: Problem): LearningProblem => {
  const categoryDefault = categoryDefaults[problem.category];
  const override = problemOverrides[problem.id] || {};

  return {
    ...problem,
    ...categoryDefault,
    difficulty: inferDifficulty(problem, override.difficulty ?? categoryDefault.difficulty),
    estimatedMinutes: problem.estimatedMinutes ?? override.estimatedMinutes ?? categoryDefault.estimatedMinutes,
    skills: problem.skills ?? override.skills ?? categoryDefault.skills,
    prerequisites: problem.prerequisites ?? override.prerequisites ?? [],
    hintSteps:
      problem.hintSteps ??
      override.hintSteps ??
      (problem.hint ? [problem.hint] : [`まずは TODO の周辺だけに集中して、1か所ずつ直していきましょう。`]),
    successMessage:
      problem.successMessage ??
      override.successMessage ??
      `${problem.title} を完了しました。1つの概念を自分の手で直せたので、確かな前進です。`,
    reviewAfterDays: problem.reviewAfterDays ?? override.reviewAfterDays ?? categoryDefault.reviewAfterDays,
    mode: problem.mode ?? override.mode ?? categoryDefault.mode,
    templateSteps: problem.templateSteps ?? override.templateSteps ?? categoryDefault.templateSteps,
    starterCode: problem.starterCode ?? override.starterCode,
  };
};

export const problems: LearningProblem[] = rawProblems.map(withProblemDefaults);
