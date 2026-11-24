// Added to the lit colour just before <opaque_fragment>.
// normal: perturbed view-space normal; vViewPosition: -mvPosition.xyz (points at the camera).
outgoingLight += thinFilm(normal, normalize(vViewPosition));
