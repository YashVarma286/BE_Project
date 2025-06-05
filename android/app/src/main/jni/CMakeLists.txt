cmake_minimum_required(VERSION 3.13)

# Define the library name here.
project(appmodules)

# This file includes all the necessary to let you build your React Native application
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

# Add the path to the ssdeep library and headers
#set(LIBFUZZY_DIR ${CMAKE_SOURCE_DIR}/libs)

if(${ANDROID_ABI} STREQUAL "armeabi-v7a")
  set(LIBFUZZY_DIR ${CMAKE_SOURCE_DIR}/libs/armeabi-v7a)
elseif(${ANDROID_ABI} STREQUAL "arm64-v8a")
  set(LIBFUZZY_DIR ${CMAKE_SOURCE_DIR}/libs/arm64-v8a)
elseif(${ANDROID_ABI} STREQUAL "x86")
  set(LIBFUZZY_DIR ${CMAKE_SOURCE_DIR}/libs/x86)
elseif(${ANDROID_ABI} STREQUAL "x86_64")
  set(LIBFUZZY_DIR ${CMAKE_SOURCE_DIR}/libs/x86_64)
endif()

set(LIBFUZZY_INCLUDE_DIR ${CMAKE_SOURCE_DIR}/include)

# Add the ssdeep library
add_library(libfuzzy SHARED IMPORTED)
set_target_properties(libfuzzy PROPERTIES IMPORTED_LOCATION ${LIBFUZZY_DIR}/libfuzzy.so)

# Define where the additional source code lives. We need to crawl back the jni, main, src, app, android folders
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ../../../../../shared/NativeSampleModule.cpp)
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ../../../../../shared/NativeSSDeepModule.cpp)

# Define where CMake can find the additional header files. We need to crawl back the jni, main, src, app, android folders
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ../../../../../shared)
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ${LIBFUZZY_INCLUDE_DIR})

# Link the ssdeep library
target_link_libraries(${CMAKE_PROJECT_NAME} libfuzzy)