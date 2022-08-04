/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package org.pytorch.live.example;

import androidx.annotation.Keep;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.JSIModulePackage;
import com.facebook.react.bridge.JSIModuleSpec;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.soloader.SoLoader;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.pytorch.rn.core.jsi.PyTorchCoreJSIModulePackage;

/**
 * This is a custom JSIModulePackage that loads the shared object library after
 * the SoLoader initialized in the MainApplication.onCreate.
 */
@DoNotStrip
@Keep
public class CustomJSIModulePackage implements JSIModulePackage {

    // 2. Load shared object library with torchvision ops
    static {
        SoLoader.loadLibrary("torchvision_ops");
    }

    @DoNotStrip
    @Keep
    @Override
    public List<JSIModuleSpec> getJSIModules(
            ReactApplicationContext reactApplicationContext, JavaScriptContextHolder jsContext) {
        return new PyTorchCoreJSIModulePackage().getJSIModules(reactApplicationContext, jsContext);
    }
}
