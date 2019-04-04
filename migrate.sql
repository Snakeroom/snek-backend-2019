--
-- PostgreSQL database dump
--

-- Dumped from database version 11.2 (Ubuntu 11.2-1.pgdg18.04+1)
-- Dumped by pg_dump version 11.2 (Ubuntu 11.2-1.pgdg18.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: audit; Type: TABLE; Schema: public; Owner: sphere
--

CREATE TABLE public.audit (
    id integer NOT NULL,
    user_id text,
    method text,
    path text,
    action text,
    "timestamp" timestamp without time zone NOT NULL
);


ALTER TABLE public.audit OWNER TO sphere;

--
-- Name: audit_id_seq; Type: SEQUENCE; Schema: public; Owner: sphere
--

CREATE SEQUENCE public.audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.audit_id_seq OWNER TO sphere;

--
-- Name: audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sphere
--

ALTER SEQUENCE public.audit_id_seq OWNED BY public.audit.id;


--
-- Name: scenes; Type: TABLE; Schema: public; Owner: sphere
--

CREATE TABLE public.scenes (
    scene_id integer NOT NULL,
    fullname text
);


ALTER TABLE public.scenes OWNER TO sphere;

--
-- Name: science; Type: TABLE; Schema: public; Owner: sphere
--

CREATE TABLE public.science (
    id text NOT NULL,
    total_votes integer
);


ALTER TABLE public.science OWNER TO sphere;

--
-- Name: session; Type: TABLE; Schema: public; Owner: sphere
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO sphere;

--
-- Name: users; Type: TABLE; Schema: public; Owner: sphere
--

CREATE TABLE public.users (
    id text NOT NULL,
    username text NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    date bigint NOT NULL,
    admin boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO sphere;

--
-- Name: audit id; Type: DEFAULT; Schema: public; Owner: sphere
--

ALTER TABLE ONLY public.audit ALTER COLUMN id SET DEFAULT nextval('public.audit_id_seq'::regclass);


--
-- Name: audit audit_pkey; Type: CONSTRAINT; Schema: public; Owner: sphere
--

ALTER TABLE ONLY public.audit
    ADD CONSTRAINT audit_pkey PRIMARY KEY (id);


--
-- Name: scenes scenes_pkey; Type: CONSTRAINT; Schema: public; Owner: sphere
--

ALTER TABLE ONLY public.scenes
    ADD CONSTRAINT scenes_pkey PRIMARY KEY (scene_id);


--
-- Name: science science_pkey; Type: CONSTRAINT; Schema: public; Owner: sphere
--

ALTER TABLE ONLY public.science
    ADD CONSTRAINT science_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: sphere
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: sphere
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: audit audit_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sphere
--

ALTER TABLE ONLY public.audit
    ADD CONSTRAINT audit_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

GRANT ALL ON SCHEMA public TO sphere;


--
-- PostgreSQL database dump complete
--

