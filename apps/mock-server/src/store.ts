export interface MockRecord {
 id: number;
 method: string;
 path: string;
 query: Record<string, string>;
 body: unknown;
 receivedAt: number;
}

export class RecordStore {
 private readonly maxLength: number;
 private readonly records: MockRecord[] = [];
 private nextId = 1;

 constructor(maxLength = 200) {
  this.maxLength = maxLength;
 }

 add(input: Omit<MockRecord, "id" | "receivedAt">): MockRecord {
  const record = {
   ...input,
   id: this.nextId,
   receivedAt: Date.now()
  };
  this.nextId += 1;
  this.records.push(record);
  if (this.records.length > this.maxLength) {
   this.records.splice(0, this.records.length - this.maxLength);
  }
  return record;
 }

 list(): MockRecord[] {
  return [...this.records];
 }

 clear(): void {
  this.records.length = 0;
 }
}
