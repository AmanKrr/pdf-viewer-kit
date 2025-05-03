[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/annotations/PDFAnnotationFactory](../README.md) / AnnotationFactory

# Class: AnnotationFactory

Defined in: viewer/annotations/PDFAnnotationFactory.ts:51

Factory class for creating shape annotations.

## Constructors

### Constructor

> **new AnnotationFactory**(): `AnnotationFactory`

#### Returns

`AnnotationFactory`

## Methods

### createAnnotation()

> `static` **createAnnotation**(`options`): [`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md)

Defined in: viewer/annotations/PDFAnnotationFactory.ts:59

Creates an annotation instance based on the specified options.

#### Parameters

##### options

[`CreateAnnotationOptions`](../interfaces/CreateAnnotationOptions.md)

Configuration for the annotation to create.

#### Returns

[`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md)

An IAnnotation instance corresponding to the requested shape.

#### Throws

Error if the specified shape type is not supported.
