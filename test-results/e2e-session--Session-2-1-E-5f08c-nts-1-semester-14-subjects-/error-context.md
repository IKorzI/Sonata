# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\session.spec.js >> [Session] 2.1. Empty statements (1 semester 14 subjects)
- Location: e2e\session.spec.js:153:1

# Error details

```
Error: The file 'I семестр/Відомості для викладачів.xlsx' differs from the reference!

expect(received).toBeUndefined()

Received: "I семестр/Відомості для викладачів.xlsx"
```

# Test source

```ts
  109 | //   await test.step("2. Fill out the form and start", async () => {
  110 | //     await window.locator(".section-button#package-of-documents").click();
  111 | //     const filePath = path.join(inputPath, "statements_15.xlsx");
  112 | //     await window
  113 | //       .locator(".file-input#session--package-of-documents--statements input")
  114 | //       .setInputFiles(filePath);
  115 | //     await window.locator(".social-scholarship .add").click();
  116 | //     await window.locator(".social-scholarship .add").click();
  117 | //     await window.locator(".social-scholarship .list #row-0 .student").click();
  118 | //     await window.getByText("Білан Інна Євгенівна").click();
  119 | //     await window.locator(".social-scholarship .list #row-0 .status").click();
  120 | //     await window.getByText("Внутрішньо переміщена особа").click();
  121 | //     await window.locator(".social-scholarship .list #row-1 .student").click();
  122 | //     await window.getByText("Безуглий Юрій Віталійович").click();
  123 | //     await window.locator(".social-scholarship .list #row-1 .status").click();
  124 | //     await window.getByText("Дитина учасника бойових дій").click();
  125 | //     await window.locator(".social-scholarship .label2").click();
  126 | //     await window.locator(".social-scholarship .add").click();
  127 | //     await window.locator(".social-scholarship .list #row-0 .student").click();
  128 | //     await window.getByText("Сидоренко Ілля Артемович").click();
  129 | 
  130 | //     await window.locator(".workspace > .start").click();
  131 | //   });
  132 | 
  133 | //   await test.step("3. Waiting for output files", async () => {
  134 | //     await waitFiles(outputPath, files);
  135 | //   });
  136 | 
  137 | //   await test.step("4. Checking output files", async () => {
  138 | //     const mismatchedFile = await checkingOutputFiles(
  139 | //       referencePath,
  140 | //       outputPath,
  141 | //       files,
  142 | //     );
  143 | 
  144 | //     expect(
  145 | //       mismatchedFile,
  146 | //       `The file '${mismatchedFile}' differs from the reference!`,
  147 | //     ).toBeUndefined();
  148 | //   });
  149 | 
  150 | //   await electronApp.close();
  151 | // });
  152 | 
  153 | test("[Session] 2.1. Empty statements (1 semester 14 subjects)", async () => {
  154 |   test.setTimeout(60000);
  155 | 
  156 |   const inputPath = path.join(projectPath, "test/empty-statements/");
  157 |   const referencePath = path.join(
  158 |     inputPath,
  159 |     "reference/1 semester 14 subjects/",
  160 |   );
  161 |   const files = [
  162 |     "I семестр/25-1/Відомості 25-1.xlsx",
  163 |     "I семестр/25-2/Відомості 25-2.xlsx",
  164 |     "I семестр/25-3/Відомості 25-3.xlsx",
  165 |     "I семестр/25-4/Відомості 25-4.xlsx",
  166 |     "I семестр/25-5/Відомості 25-5.xlsx",
  167 |     "I семестр/Відомості для викладачів.xlsx",
  168 |     "I семестр/Журнал видачі відомостей.xlsx",
  169 |   ];
  170 | 
  171 |   let electronApp, window;
  172 | 
  173 |   await test.step("1. Launching the application", async () => {
  174 |     await preparingTheFolder(inputPath, files);
  175 |     [electronApp, window] = await electronLaunch();
  176 |   });
  177 | 
  178 |   await test.step("2. Fill out the form and start", async () => {
  179 |     await window.locator(".section-button#empty-statements").click();
  180 |     const hoursFilePath = path.join(inputPath, "hours_1_14.xlsx");
  181 |     await window
  182 |       .locator(".file-input#session--empty-statements--hours input")
  183 |       .setInputFiles(hoursFilePath);
  184 |     const contingentFilePath = path.join(inputPath, "contingent.xlsx");
  185 |     await window
  186 |       .locator(".file-input#session--empty-statements--contingent input")
  187 |       .setInputFiles(contingentFilePath);
  188 |     await window.locator(".semester-number input").fill("1");
  189 | 
  190 |     await window.locator(".workspace > .start").click();
  191 |   });
  192 | 
  193 |   await test.step("3. Waiting for output files", async () => {
  194 |     await waitFiles(outputPath, files);
  195 |   });
  196 | 
  197 |   await sleep(2000);
  198 | 
  199 |   await test.step("4. Checking output files", async () => {
  200 |     const mismatchedFile = await checkingOutputFiles(
  201 |       referencePath,
  202 |       outputPath,
  203 |       files,
  204 |     );
  205 | 
  206 |     expect(
  207 |       mismatchedFile,
  208 |       `The file '${mismatchedFile}' differs from the reference!`,
> 209 |     ).toBeUndefined();
      |       ^ Error: The file 'I семестр/Відомості для викладачів.xlsx' differs from the reference!
  210 |   });
  211 | 
  212 |   await electronApp.close();
  213 | });
  214 | 
  215 | // test("[Session] 2.2. Empty statements (1 semester 15 subjects)", async () => {
  216 | //   test.setTimeout(60000);
  217 | 
  218 | //   const inputPath = path.join(projectPath, "test/empty-statements/");
  219 | //   const referencePath = path.join(
  220 | //     inputPath,
  221 | //     "reference/1 semester 15 subjects/",
  222 | //   );
  223 | //   const files = [
  224 | //     "I семестр/25-1/Відомості 25-1.xlsx",
  225 | //     "I семестр/25-2/Відомості 25-2.xlsx",
  226 | //     "I семестр/25-3/Відомості 25-3.xlsx",
  227 | //     "I семестр/25-4/Відомості 25-4.xlsx",
  228 | //     "I семестр/25-5/Відомості 25-5.xlsx",
  229 | //     "I семестр/Відомості для викладачів.xlsx",
  230 | //     "I семестр/Журнал видачі відомостей.xlsx",
  231 | //   ];
  232 | 
  233 | //   let electronApp, window;
  234 | 
  235 | //   await test.step("1. Launching the application", async () => {
  236 | //     await preparingTheFolder(inputPath, files);
  237 | //     [electronApp, window] = await electronLaunch();
  238 | //   });
  239 | 
  240 | //   await test.step("2. Fill out the form and start", async () => {
  241 | //     await window.locator(".section-button#empty-statements").click();
  242 | //     const hoursFilePath = path.join(inputPath, "hours_1_15.xlsx");
  243 | //     await window
  244 | //       .locator(".file-input#session--empty-statements--hours input")
  245 | //       .setInputFiles(hoursFilePath);
  246 | //     const contingentFilePath = path.join(inputPath, "contingent.xlsx");
  247 | //     await window
  248 | //       .locator(".file-input#session--empty-statements--contingent input")
  249 | //       .setInputFiles(contingentFilePath);
  250 | //     await window.locator(".semester-number input").fill("1");
  251 | 
  252 | //     await window.locator(".workspace > .start").click();
  253 | //   });
  254 | 
  255 | //   await test.step("3. Waiting for output files", async () => {
  256 | //     await waitFiles(outputPath, files);
  257 | //   });
  258 | 
  259 | //   await test.step("4. Checking output files", async () => {
  260 | //     const mismatchedFile = await checkingOutputFiles(
  261 | //       referencePath,
  262 | //       outputPath,
  263 | //       files,
  264 | //     );
  265 | 
  266 | //     expect(
  267 | //       mismatchedFile,
  268 | //       `The file '${mismatchedFile}' differs from the reference!`,
  269 | //     ).toBeUndefined();
  270 | //   });
  271 | 
  272 | //   await electronApp.close();
  273 | // });
  274 | 
  275 | // test("[Session] 2.3. Empty statements (2 semester 14 subjects)", async () => {
  276 | //   test.setTimeout(60000);
  277 | 
  278 | //   const inputPath = path.join(projectPath, "test/empty-statements/");
  279 | //   const referencePath = path.join(
  280 | //     inputPath,
  281 | //     "reference/2 semester 14 subjects/",
  282 | //   );
  283 | //   const files = [
  284 | //     "II семестр/25-1/Відомості 25-1.xlsx",
  285 | //     "II семестр/25-2/Відомості 25-2.xlsx",
  286 | //     "II семестр/25-3/Відомості 25-3.xlsx",
  287 | //     "II семестр/25-4/Відомості 25-4.xlsx",
  288 | //     "II семестр/25-5/Відомості 25-5.xlsx",
  289 | //     "II семестр/Відомості для викладачів.xlsx",
  290 | //     "II семестр/Журнал видачі відомостей.xlsx",
  291 | 
  292 | //     "рік/25-1/Відомості 25-1.xlsx",
  293 | //     "рік/25-2/Відомості 25-2.xlsx",
  294 | //     "рік/25-3/Відомості 25-3.xlsx",
  295 | //     "рік/25-4/Відомості 25-4.xlsx",
  296 | //     "рік/25-5/Відомості 25-5.xlsx",
  297 | //     "рік/Відомості для викладачів.xlsx",
  298 | //     "рік/Журнал видачі відомостей.xlsx",
  299 | //   ];
  300 | 
  301 | //   let electronApp, window;
  302 | 
  303 | //   await test.step("1. Launching the application", async () => {
  304 | //     await preparingTheFolder(inputPath, files);
  305 | //     [electronApp, window] = await electronLaunch();
  306 | //   });
  307 | 
  308 | //   await test.step("2. Fill out the form and start", async () => {
  309 | //     await window.locator(".section-button#empty-statements").click();
```