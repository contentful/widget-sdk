// Allow importing svgs in typescript
declare module '*.svg' {
  const content: any;
  export default content;
}
