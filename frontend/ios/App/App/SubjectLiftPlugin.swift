import Foundation
import Capacitor
import Vision
import UIKit
import CoreImage

/**
 Lifts the clothing out of a wardrobe photo, on the device.

 iOS 17 added `VNGenerateForegroundInstanceMaskRequest` — the same subject-lifting the Photos app
 uses when you long-press an object. It runs locally in well under a second, costs nothing and
 needs no network, which is why the cut-out happens here rather than on the server: the server-side
 model peaked at over a gigabyte of memory, against a 512MB container.

 The contract is deliberately forgiving. On anything older than iOS 17, or where Vision finds no
 subject, this resolves with `lifted: false` rather than rejecting, and the app stores the original
 photo instead. A missing cut-out should never cost someone the piece they just photographed.
 */
@objc(SubjectLiftPlugin)
public class SubjectLiftPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SubjectLiftPlugin"
    public let jsName = "SubjectLift"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "lift", returnType: CAPPluginReturnPromise)
    ]

    @objc func isSupported(_ call: CAPPluginCall) {
        if #available(iOS 17.0, *) {
            call.resolve(["supported": true])
        } else {
            call.resolve(["supported": false])
        }
    }

    @objc func lift(_ call: CAPPluginCall) {
        guard let base64 = call.getString("image"),
              let data = Data(base64Encoded: base64),
              let source = UIImage(data: data),
              let cgImage = source.cgImage else {
            call.reject("That photo could not be read.")
            return
        }

        guard #available(iOS 17.0, *) else {
            call.resolve(["supported": false, "lifted": false])
            return
        }

        // Vision is not cheap; keep it off the main thread so the camera sheet dismisses cleanly.
        DispatchQueue.global(qos: .userInitiated).async {
            let request = VNGenerateForegroundInstanceMaskRequest()
            let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

            do {
                try handler.perform([request])

                guard let result = request.results?.first, !result.allInstances.isEmpty else {
                    // A flat photo of a folded jumper on a duvet may have no distinct subject.
                    DispatchQueue.main.async { call.resolve(["supported": true, "lifted": false]) }
                    return
                }

                // croppedToInstancesExtent trims the transparent margin, so the piece fills its
                // frame in the wardrobe grid instead of floating in a sea of empty pixels.
                let buffer = try result.generateMaskedImage(
                    ofInstances: result.allInstances,
                    from: handler,
                    croppedToInstancesExtent: true
                )

                let ciImage = CIImage(cvPixelBuffer: buffer)
                let context = CIContext()
                guard let cut = context.createCGImage(ciImage, from: ciImage.extent),
                      let png = UIImage(cgImage: cut).pngData() else {
                    DispatchQueue.main.async { call.resolve(["supported": true, "lifted": false]) }
                    return
                }

                DispatchQueue.main.async {
                    call.resolve([
                        "supported": true,
                        "lifted": true,
                        "image": png.base64EncodedString(),
                        "width": cut.width,
                        "height": cut.height
                    ])
                }
            } catch {
                // Treat a Vision failure as "no cut-out available", not as a lost photo.
                DispatchQueue.main.async { call.resolve(["supported": true, "lifted": false]) }
            }
        }
    }
}
