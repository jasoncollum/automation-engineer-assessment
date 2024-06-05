export class User {
  constructor(id: number, email: string, name: string) {
    this.id = id;
    this.email = email;
    this.name = name;
  }

  id: number;
  email: string;
  name: string;
}
