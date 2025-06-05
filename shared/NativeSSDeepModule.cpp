#include "NativeSSDeepModule.h"
#include <fstream>
#include <sstream>
#include <vector>
#include <utility>

namespace facebook::react {

NativeSSDeepModule::NativeSSDeepModule(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeSSDeepModuleCxxSpec(std::move(jsInvoker)) {}

std::string NativeSSDeepModule::hashString(jsi::Runtime& rt, std::string input) {
  char result[FUZZY_MAX_RESULT];
  fuzzy_hash_buf((const unsigned char*)input.c_str(), input.length(), result);
  return std::string(result);
}

std::string NativeSSDeepModule::hashFile(jsi::Runtime& rt, std::string filePath) {
  char result[FUZZY_MAX_RESULT];
  if (fuzzy_hash_filename(filePath.c_str(), result) != 0) {
    throw std::runtime_error("Failed to compute file hash");
  }
  return std::string(result);
}

int NativeSSDeepModule::compareHashes(jsi::Runtime& rt, std::string hash1, std::string hash2) {
  return fuzzy_compare(hash1.c_str(), hash2.c_str());
}
jsi::Array NativeSSDeepModule::compareHashWithArray(jsi::Runtime& rt, std::string newHash, jsi::Array hashArray, int threshold) {
  std::vector<std::pair<std::string, int>> results;

  // Iterate over the array of hashes
  for (size_t i = 0; i < hashArray.size(rt); i++) {
    std::string existingHash = hashArray.getValueAtIndex(rt, i).asString(rt).utf8(rt);
    int similarity = fuzzy_compare(newHash.c_str(), existingHash.c_str());

    if (similarity >= threshold) {
      results.push_back({existingHash, similarity});
    }
  }

  // Convert results to a JSI array
  jsi::Array resultArray(rt, results.size());
  for (size_t i = 0; i < results.size(); i++) {
    jsi::Object resultObj(rt);
    resultObj.setProperty(rt, "hash", jsi::String::createFromUtf8(rt, results[i].first));
    resultObj.setProperty(rt, "similarity", jsi::Value(results[i].second));
    resultArray.setValueAtIndex(rt, i, resultObj);
  }

  return resultArray;
}

} // namespace facebook::react