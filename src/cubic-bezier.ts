/**
 * Form [WebKit UnitBezier.h](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/UnitBezier.h)
 */

export function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number) {

  const CUBIC_BEZIER_SPLINE_SAMPLES = 11
  const BEZIER_EPSILON = 1e-7
  const MAX_NEWTON_ITERATIONS = 4

  // Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
  let cx = 3 * p1x
  let bx = 3 * (p2x - p1x) - cx
  let ax = 1 - cx - bx

  let cy = 3 * p1y
  let by = 3 * (p2y - p1y) - cy
  let ay = 1 - cy - by

  let startGradient: number
  let endGradient: number

  let splineSamples = [CUBIC_BEZIER_SPLINE_SAMPLES]

  // End-point gradients are used to calculate timing function results
  // outside the range [0, 1].
  //
  // There are four possibilities for the gradient at each end:
  // (1) the closest control point is not horizontally coincident with regard to
  //     (0, 0) or (1, 1). In this case the line between the end point and
  //     the control point is tangent to the bezier at the end point.
  // (2) the closest control point is coincident with the end point. In
  //     this case the line between the end point and the far control
  //     point is tangent to the bezier at the end point.
  // (3) both internal control points are coincident with an endpoint. There
  //     are two special case that fall into this category:
  //     CubicBezier(0, 0, 0, 0) and CubicBezier(1, 1, 1, 1). Both are
  //     equivalent to linear.
  // (4) the closest control point is horizontally coincident with the end
  //     point, but vertically distinct. In this case the gradient at the
  //     end point is Infinite. However, this causes issues when
  //     interpolating. As a result, we break down to a simple case of
  //     0 gradient under these conditions.
  if (p1x > 0)
    startGradient = p1y / p1x
  else if (!p1y && p2x > 0)
    startGradient = p2y / p2x
  else if (!p1y && !p2y)
    startGradient = 1
  else
    startGradient = 0
  if (p2x < 1)
    endGradient = (p2y - 1) / (p2x - 1)
  else if (p2y == 1 && p1x < 1)
    endGradient = (p1y - 1) / (p1x - 1)
  else if (p2y == 1 && p1y == 1)
    endGradient = 1
  else
    endGradient = 0

  const deltaT = 1 / (CUBIC_BEZIER_SPLINE_SAMPLES - 1)
  for (let i = 0; i < CUBIC_BEZIER_SPLINE_SAMPLES; i++)
    splineSamples[i] = sampleCurveX(i * deltaT)


  function sampleCurveX(t: number) {
    // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
    return ((ax * t + bx) * t + cx) * t
  }

  function sampleCurveY(t: number) {
    return ((ay * t + by) * t + cy) * t
  }

  function sampleCurveDerivativeX(t: number) {
    return (3 * ax * t + 2 * bx) * t + cx
  }

  // Given an x value, find a parametric value it came from.
  function solveCurveX(x: number, epsilon = Number.EPSILON) {
    let t0 = 0
    let t1 = 0
    let t2 = x
    let x2 = 0
    let d2 = 0
    let i = 0

    // Linear interpolation of spline curve for initial guess.
    const deltaT = 1 / (CUBIC_BEZIER_SPLINE_SAMPLES - 1)
    for (i = 1; i < CUBIC_BEZIER_SPLINE_SAMPLES; i++) {
      if (x <= splineSamples[i]) {
        t1 = deltaT * i
        t0 = t1 - deltaT
        t2 = t0 + (t1 - t0) * (x - splineSamples[i - 1]) / (splineSamples[i] - splineSamples[i - 1])
        break
      }
    }

    // Perform a few iterations of Newton's method -- normally very fast.
    // See https://en.wikipedia.org/wiki/Newton%27s_method.
    const newtonEpsilon = Math.min(BEZIER_EPSILON, epsilon)
    for (i = 0; i < MAX_NEWTON_ITERATIONS; i++) {
      x2 = sampleCurveX(t2) - x
      if (Math.abs(x2) < newtonEpsilon)
        return t2
      d2 = sampleCurveDerivativeX(t2)
      if (Math.abs(d2) < BEZIER_EPSILON)
        break
      t2 = t2 - x2 / d2
    }
    if (Math.abs(x2) < epsilon)
      return t2

    // Fall back to the bisection method for reliability.
    // changed: [t0 < t1] -> [t1 - t0 < epsilon]
    while (t1 - t0 < epsilon) {
      x2 = sampleCurveX(t2)
      if (Math.abs(x2 - x) < epsilon)
        return t2
      if (x > x2)
        t0 = t2
      else
        t1 = t2
      t2 = (t1 + t0) * 0.5
    }

    // Failure.
    return t2
  }

  return function solve(x: number, epsilon = Number.EPSILON) {
    if (x < 0)
      return 0 + startGradient * x
    if (x > 1)
      return 1 + endGradient * (x - 1)
    return sampleCurveY(solveCurveX(x, epsilon))
  }
}
