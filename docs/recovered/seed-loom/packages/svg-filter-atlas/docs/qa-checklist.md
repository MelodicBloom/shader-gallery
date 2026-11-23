# QA checklist

## Static

- [ ] Recipe validates.
- [ ] IDs are unique and kebab-case.
- [ ] Parameter bindings resolve.
- [ ] Preset values remain inside declared bounds.
- [ ] Generated files match the committed recipe sources.

## Visual

- [ ] No clipping at the declared filter region.
- [ ] No unexpected transparency or black output.
- [ ] Chromium, Firefox, and WebKit remain recognizably equivalent.
- [ ] Light and dark preview surfaces were checked.
- [ ] Text remains readable or an unfiltered semantic duplicate exists.

## Performance

- [ ] Instance count stays within the recipe recommendation.
- [ ] Applied area stays within the recipe recommendation.
- [ ] Heavy filters are absent from long continuously scrolling regions.
- [ ] Animated extensions include a reduced-motion fallback.
