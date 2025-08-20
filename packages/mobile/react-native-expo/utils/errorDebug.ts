// Enhanced error debugging utilities
import { Platform } from 'react-native';

// Store original handlers
let originalConsoleError: typeof console.error;
let originalConsoleWarn: typeof console.warn;

// Enhanced stack trace parser for Hermes
function parseHermesStackTrace(stack: string): string[] {
  const lines = stack.split('\n');
  const parsed: string[] = [];
  
  for (const line of lines) {
    // Parse Hermes stack trace format
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match) {
      const [, functionName, file, lineNumber, columnNumber] = match;
      parsed.push(`  ${functionName} (${file}:${lineNumber}:${columnNumber})`);
    } else if (line.includes('at ')) {
      parsed.push(line);
    }
  }
  
  return parsed;
}

// Global error handler setup
export function setupGlobalErrorHandlers() {
  console.log('🔧 Setting up enhanced error handlers...');

  // Override console.error to catch publicKey errors
  originalConsoleError = console.error;
  console.error = (...args) => {
    const errorString = args.join(' ');
    
    if (errorString.includes('publicKey')) {
      console.log('\n🔴 ========== PUBLIC KEY ERROR DETECTED ==========');
      console.log('Arguments:', args);
      
      // Try to get enhanced stack trace
      const error = new Error('Tracing publicKey error');
      console.log('\n📍 Stack Trace:');
      if (error.stack) {
        const parsedStack = parseHermesStackTrace(error.stack);
        parsedStack.forEach(line => console.log(line));
      }
      
      // Log all arguments separately for better inspection
      args.forEach((arg, index) => {
        console.log(`\nArgument ${index}:`, typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg);
      });
      
      console.log('================================================\n');
    }
    
    originalConsoleError.apply(console, args);
  };

  // Override console.warn for additional coverage
  originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const warnString = args.join(' ');
    
    if (warnString.includes('publicKey')) {
      console.log('\n⚠️  ========== PUBLIC KEY WARNING ==========');
      console.log('Warning:', args);
      console.trace('Warning trace');
      console.log('==========================================\n');
    }
    
    originalConsoleWarn.apply(console, args);
  };

  // Handle unhandled promise rejections
  const handleUnhandledRejection = (error: any, promise?: Promise<any>) => {
    console.log('\n❌ ========== UNHANDLED PROMISE REJECTION ==========');
    
    if (error?.message?.includes('publicKey') || error?.stack?.includes('publicKey')) {
      console.log('🔴 This is the publicKey error in unhandled rejection!');
      console.log('Error object:', error);
      console.log('Error message:', error?.message);
      console.log('Error stack:', error?.stack);
      
      if (error?.stack) {
        console.log('\nParsed stack:');
        const parsedStack = parseHermesStackTrace(error.stack);
        parsedStack.forEach(line => console.log(line));
      }
      
      // Try to find the source
      if (promise) {
        console.log('\nPromise:', promise);
      }
    } else {
      console.log('Error:', error);
    }
    
    console.log('==================================================\n');
  };

  // Platform-specific setup
  if (Platform.OS === 'web') {
    // Web environment
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        handleUnhandledRejection(event.reason, event.promise);
      });
      
      window.addEventListener('error', (event) => {
        if (event.error?.message?.includes('publicKey')) {
          console.log('\n🔴 ========== WINDOW ERROR EVENT (publicKey) ==========');
          console.log('Error:', event.error);
          console.log('Message:', event.message);
          console.log('Source:', event.filename);
          console.log('Line:', event.lineno);
          console.log('Column:', event.colno);
          console.log('======================================================\n');
        }
      });
    }
  } else {
    // React Native environment
    const RNErrorUtils = (global as any).ErrorUtils;
    if (RNErrorUtils) {
      const originalHandler = RNErrorUtils.getGlobalHandler();
      
      RNErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        if (error?.message?.includes('publicKey') || error?.stack?.includes('publicKey')) {
          console.log('\n🔴 ========== REACT NATIVE GLOBAL ERROR (publicKey) ==========');
          console.log('Fatal:', isFatal);
          console.log('Error:', error);
          console.log('Message:', error.message);
          console.log('Stack:', error.stack);
          
          if (error.stack) {
            console.log('\nParsed stack:');
            const parsedStack = parseHermesStackTrace(error.stack);
            parsedStack.forEach(line => console.log(line));
          }
          
          console.log('==============================================================\n');
        }
        
        // Call original handler
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }
  }

  // Track Promise constructor to find where promises are created
  const OriginalPromise = Promise;
  (global as any).Promise = class TrackedPromise extends OriginalPromise {
    constructor(executor: (resolve: (value: any) => void, reject: (reason?: any) => void) => void) {
      const stack = new Error().stack;
      
      super((resolve, reject) => {
        const wrappedReject = (reason: any) => {
          if (reason?.message?.includes('publicKey') || reason?.toString?.().includes('publicKey')) {
            console.log('\n🔴 ========== PROMISE REJECTION WITH publicKey ==========');
            console.log('Rejection reason:', reason);
            console.log('Promise created at:', stack);
            console.log('========================================================\n');
          }
          reject(reason);
        };
        
        executor(resolve, wrappedReject);
      });
    }
  };

  console.log('✅ Enhanced error handlers installed');
  console.log('   - Console.error override: active');
  console.log('   - Console.warn override: active');
  console.log('   - Unhandled rejection handler: active');
  console.log('   - Global error handler: active');
  console.log('   - Promise tracking: active\n');
}

// Cleanup function
export function cleanupErrorHandlers() {
  if (originalConsoleError) {
    console.error = originalConsoleError;
  }
  if (originalConsoleWarn) {
    console.warn = originalConsoleWarn;
  }
  
  // Restore original Promise if needed
  // Note: This is tricky and might not be fully reversible
  
  console.log('🧹 Error handlers cleaned up');
}