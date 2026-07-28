import {
Entity,
PrimaryGeneratedColumn,
Column,
CreateDateColumn
} from "typeorm";

@Entity("notifications")
export class Notification{

@PrimaryGeneratedColumn()
id!:number;

@Column("uuid")
userId!: string;

@Column()
type!:string;

@Column()
title!:string;

@Column()
message!:string;

@Column({
default:false
})
isRead!:boolean;

@CreateDateColumn()
createdAt!:Date;

@Column('varchar', { nullable: true })
customerId!: string | null;

@Column('varchar', { nullable: true })
customerName!: string | null;

@Column('varchar', { nullable: true })
profileId!: string | null;

@Column('varchar', { nullable: true })
profileName!: string | null;

@Column('varchar', { nullable: true })
notificationType!: string | null;

@Column('varchar', { nullable: true })
action!: string | null;

}