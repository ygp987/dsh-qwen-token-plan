# Third-party notices

This plugin was built with reference to two MIT-licensed DeepSeek Harness
projects. No source file was copied wholesale, but their architecture,
wire-protocol findings and DSH slot patterns informed this implementation, so
their copyright notices and license text are retained here as required by the
MIT License.

## dsh-opencode-go

- Repository: <https://github.com/Duskriver/dsh-opencode-go>
- Used as a reference for: DSH settings-section / sidebar panel / `main` slot
  registration layout, the credential-backed provider setup flow, and the
  overall shape of a provider-plus-console plugin.
- License: MIT

```text
MIT License

Copyright (c) 2026 DeepSeek
Copyright (c) 2026 dsh-opencode-go contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## dsh-qwen-token-plan-full

- Repository: <https://github.com/Fushena/dsh-qwen-token-plan-full>
- Used as a reference for: the Qianwen console gateway protocol
  (`sec_token` + `BroadScopeAspnGateway` form posts), the Token Plan
  subscription/usage/equity/quota endpoints, the thinking-parameter mapping,
  and the DSH client slot hand-off pattern.
- License: MIT

```text
MIT License

Copyright (c) 2026 Fushena

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Qianwen AI Platform documentation

The Qianwen Token Plan API endpoints, thinking parameter names and model
metadata used by this plugin are documented facts from the platform's public
docs (<https://platform.qianwenai.com/docs>). The documentation itself is not
redistributed here.
