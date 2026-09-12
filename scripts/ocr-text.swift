// Prints the text Vision OCR finds in each image given on the command line, one
// line per string: x<TAB>y<TAB>confidence<TAB>text (x/y = top-left, 0..1), after a
// "FILE<TAB>path" line. Compiled on demand by scripts/import-weapon-attributes.py.
import Foundation
import Vision
import AppKit

let args = CommandLine.arguments.dropFirst()
for path in args {
    guard let img = NSImage(contentsOfFile: path),
          let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        print("FILE\t\(path)\tERROR"); continue
    }
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.usesLanguageCorrection = false
    let handler = VNImageRequestHandler(cgImage: cg, options: [:])
    try? handler.perform([req])
    print("FILE\t\(path)")
    for obs in req.results ?? [] {
        guard let c = obs.topCandidates(1).first else { continue }
        let b = obs.boundingBox
        print(String(format: "%.3f\t%.3f\t%.2f\t%@", b.minX, 1 - b.maxY, c.confidence, c.string))
    }
}
