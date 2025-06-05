#pragma once

#include <AppSpecsJSI.h>
#include <fuzzy.h>

#include <memory>
#include <string>
#include <vector>
#include <utility>

namespace facebook::react {

class NativeSSDeepModule : public NativeSSDeepModuleCxxSpec<NativeSSDeepModule> {
public:
  NativeSSDeepModule(std::shared_ptr<CallInvoker> jsInvoker);

  std::string hashString(jsi::Runtime& rt, std::string input);
  std::string hashFile(jsi::Runtime& rt, std::string filePath);
  int compareHashes(jsi::Runtime& rt, std::string hash1, std::string hash2);
  jsi::Array compareHashWithArray(jsi::Runtime& rt, std::string newHash, jsi::Array hashArray, int threshold);
};

} // namespace facebook::react